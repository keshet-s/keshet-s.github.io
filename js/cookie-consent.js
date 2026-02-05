/**
 * Cookie Consent Configuration for Adaptly
 * Uses vanilla-cookieconsent v3.0+
 *
 * This script manages GDPR/CCPA compliant cookie consent with Google Analytics 4.
 * GA4 is completely blocked until the user gives explicit consent.
 *
 * @see https://cookieconsent.orestbida.com/
 * @version 1.0.0
 */

(function() {
    'use strict';

    // =========================================================================
    // CONFIGURATION
    // =========================================================================

    /**
     * Google Analytics 4 Measurement ID
     * Replace 'G-XXXXXXXXXX' with your actual GA4 measurement ID
     */
    const GA4_MEASUREMENT_ID = 'G-WE06X3C39F';

    /**
     * Consent revision number
     * Increment this when you make changes to your privacy/cookie policy
     * that require users to re-consent
     */
    const CONSENT_REVISION = 1;

    /**
     * Cookie expiration in days (6 months = ~182 days)
     */
    const COOKIE_EXPIRATION_DAYS = 182;

    /**
     * Enable debug logging (set to false in production)
     */
    const DEBUG_MODE = false;

    // =========================================================================
    // UTILITY FUNCTIONS
    // =========================================================================

    /**
     * Debug logger - only logs when DEBUG_MODE is enabled
     * @param {...any} args - Arguments to log
     */
    function debugLog(...args) {
        if (DEBUG_MODE) {
            console.log('[Cookie Consent]', ...args);
        }
    }

    /**
     * Check if Do Not Track (DNT) is enabled in the browser
     * @returns {boolean} True if DNT is enabled
     */
    function isDNTEnabled() {
        return navigator.doNotTrack === '1' ||
               navigator.doNotTrack === 'yes' ||
               window.doNotTrack === '1';
    }

    /**
     * Delete a cookie by name
     * @param {string} name - Cookie name to delete
     */
    function deleteCookie(name) {
        const domains = [window.location.hostname, '.' + window.location.hostname];
        const paths = ['/', ''];

        domains.forEach(domain => {
            paths.forEach(path => {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
            });
        });

        debugLog('Deleted cookie:', name);
    }

    /**
     * Delete all GA4 related cookies
     */
    function deleteGA4Cookies() {
        // GA4 cookie patterns
        const ga4CookiePatterns = ['_ga', '_gid', '_gat'];

        // Get all cookies
        const cookies = document.cookie.split(';');

        cookies.forEach(cookie => {
            const cookieName = cookie.split('=')[0].trim();

            // Check if cookie matches GA4 patterns
            if (ga4CookiePatterns.some(pattern => cookieName.startsWith(pattern))) {
                deleteCookie(cookieName);
            }
        });

        debugLog('All GA4 cookies deleted');
    }

    // =========================================================================
    // GOOGLE CONSENT MODE V2
    // =========================================================================

    /**
     * Initialize Google Consent Mode with default denied state
     * This MUST be called before any Google tags load
     */
    function initializeGoogleConsentMode() {
        window.dataLayer = window.dataLayer || [];

        function gtag() {
            window.dataLayer.push(arguments);
        }

        // Set default consent state to denied
        gtag('consent', 'default', {
            'analytics_storage': 'denied',
            'ad_storage': 'denied',
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'functionality_storage': 'denied',
            'personalization_storage': 'denied',
            'security_storage': 'granted', // Always granted for security purposes
            'wait_for_update': 500 // Wait for consent update before firing tags
        });

        debugLog('Google Consent Mode initialized with default denied state');
    }

    /**
     * Update Google Consent Mode based on user preferences
     * @param {boolean} analyticsConsent - Whether analytics consent was given
     */
    function updateGoogleConsentMode(analyticsConsent) {
        window.dataLayer = window.dataLayer || [];

        function gtag() {
            window.dataLayer.push(arguments);
        }

        gtag('consent', 'update', {
            'analytics_storage': analyticsConsent ? 'granted' : 'denied',
            'ad_storage': 'denied', // We don't use ads, keep denied
            'ad_user_data': 'denied',
            'ad_personalization': 'denied',
            'functionality_storage': analyticsConsent ? 'granted' : 'denied',
            'personalization_storage': analyticsConsent ? 'granted' : 'denied'
        });

        debugLog('Google Consent Mode updated:', analyticsConsent ? 'granted' : 'denied');
    }

    // =========================================================================
    // GOOGLE ANALYTICS 4
    // =========================================================================

    /**
     * Load and initialize Google Analytics 4
     * This is only called AFTER user consent is given
     */
    function loadGA4() {
        // Check if DNT is enabled - respect user's browser setting
        if (isDNTEnabled()) {
            debugLog('DNT enabled - GA4 not loaded');
            return;
        }

        // Check if GA4 is already loaded
        if (window.ga4Loaded) {
            debugLog('GA4 already loaded');
            return;
        }

        debugLog('Loading GA4...');

        // Create and append the gtag.js script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;

        script.onload = function() {
            // Initialize GA4
            window.dataLayer = window.dataLayer || [];
            function gtag() {
                window.dataLayer.push(arguments);
            }

            gtag('js', new Date());
            gtag('config', GA4_MEASUREMENT_ID, {
                'anonymize_ip': true, // Extra privacy measure (default in GA4 but explicit)
                'allow_google_signals': false, // Disable advertising features
                'allow_ad_personalization_signals': false
            });

            window.ga4Loaded = true;
            debugLog('GA4 loaded and configured');
        };

        script.onerror = function() {
            debugLog('Failed to load GA4 script');
        };

        document.head.appendChild(script);
    }

    /**
     * Disable GA4 and clean up
     */
    function disableGA4() {
        // Set opt-out flag
        window[`ga-disable-${GA4_MEASUREMENT_ID}`] = true;

        // Delete GA4 cookies
        deleteGA4Cookies();

        debugLog('GA4 disabled and cookies cleared');
    }

    // =========================================================================
    // COOKIE CONSENT INITIALIZATION
    // =========================================================================

    /**
     * Initialize cookie consent when DOM is ready
     */
    function initCookieConsent() {
        // Initialize Google Consent Mode first (before any Google tags)
        initializeGoogleConsentMode();

        // Wait for CookieConsent library to be available
        if (typeof CookieConsent === 'undefined') {
            debugLog('CookieConsent library not loaded');
            return;
        }

        CookieConsent.run({
            // =====================================================================
            // CORE SETTINGS
            // =====================================================================

            /**
             * Cookie configuration
             */
            cookie: {
                name: 'cc_cookie',
                domain: window.location.hostname,
                path: '/',
                expiresAfterDays: COOKIE_EXPIRATION_DAYS,
                sameSite: 'Lax'
            },

            /**
             * Revision number for forcing re-consent on policy changes
             */
            revision: CONSENT_REVISION,

            /**
             * Disable auto-show on page load if DNT is enabled
             */
            autoShow: !isDNTEnabled(),

            /**
             * Disable page interaction until consent is given
             * Set to false to allow interaction with the page
             */
            disablePageInteraction: false,

            /**
             * Hide the consent modal from bots/crawlers
             */
            hideFromBots: true,

            /**
             * Manage third-party scripts via data attributes
             */
            manageScriptTags: true,

            // =====================================================================
            // GUI OPTIONS
            // =====================================================================

            guiOptions: {
                consentModal: {
                    layout: 'box wide',
                    position: 'bottom center',
                    flipButtons: false,
                    equalWeightButtons: true
                },
                preferencesModal: {
                    layout: 'box',
                    position: 'right',
                    flipButtons: false,
                    equalWeightButtons: true
                }
            },

            // =====================================================================
            // CATEGORIES
            // =====================================================================

            categories: {
                /**
                 * Necessary cookies - always enabled, cannot be disabled
                 */
                necessary: {
                    enabled: true,
                    readOnly: true
                },

                /**
                 * Analytics cookies - disabled by default, requires explicit consent
                 */
                analytics: {
                    enabled: false,
                    readOnly: false,

                    /**
                     * Auto-clear these cookies when consent is withdrawn
                     */
                    autoClear: {
                        cookies: [
                            { name: /^_ga/ },      // Matches _ga and _ga_*
                            { name: '_gid' },
                            { name: /^_gat/ }      // Matches _gat and _gat_*
                        ],
                        reloadPage: false
                    }
                }
            },

            // =====================================================================
            // LANGUAGE CONFIGURATION
            // =====================================================================

            language: {
                default: 'en',
                autoDetect: 'browser',

                translations: {
                    en: {
                        consentModal: {
                            title: 'We value your privacy',
                            description: 'We use cookies to improve your experience and analyze site traffic. You can choose which cookies to allow. <a href="/privacy-policy.html" class="cc-link">Privacy Policy</a> | <a href="/cookie-policy.html" class="cc-link">Cookie Policy</a>',
                            acceptAllBtn: 'Accept All',
                            acceptNecessaryBtn: 'Reject All',
                            showPreferencesBtn: 'Manage Preferences',
                            footer: '<a href="/privacy-policy.html" class="cc-link">Privacy Policy</a> | <a href="/cookie-policy.html" class="cc-link">Cookie Policy</a>'
                        },
                        preferencesModal: {
                            title: 'Cookie Preferences',
                            acceptAllBtn: 'Accept All',
                            acceptNecessaryBtn: 'Reject All',
                            savePreferencesBtn: 'Save Preferences',
                            closeIconLabel: 'Close',
                            serviceCounterLabel: 'Service|Services',
                            sections: [
                                {
                                    title: 'Cookie Usage',
                                    description: 'We use cookies to ensure basic site functionality and to improve your experience. You can choose which categories to allow. For more details, see our <a href="/privacy-policy.html" class="cc-link">Privacy Policy</a> and <a href="/cookie-policy.html" class="cc-link">Cookie Policy</a>.'
                                },
                                {
                                    title: 'Strictly Necessary Cookies',
                                    description: 'These cookies are essential for the website to function properly. They enable basic functions like page navigation, secure access, and remembering your consent preferences. The website cannot function properly without these cookies.',
                                    linkedCategory: 'necessary',
                                    cookieTable: {
                                        headers: {
                                            name: 'Cookie',
                                            domain: 'Domain',
                                            expiration: 'Expiration',
                                            description: 'Description'
                                        },
                                        body: [
                                            {
                                                name: 'cc_cookie',
                                                domain: window.location.hostname,
                                                expiration: '6 months',
                                                description: 'Stores your cookie consent preferences'
                                            }
                                        ]
                                    }
                                },
                                {
                                    title: 'Analytics Cookies',
                                    description: 'These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve our website and services.',
                                    linkedCategory: 'analytics',
                                    cookieTable: {
                                        headers: {
                                            name: 'Cookie',
                                            domain: 'Domain',
                                            expiration: 'Expiration',
                                            description: 'Description'
                                        },
                                        body: [
                                            {
                                                name: '_ga',
                                                domain: window.location.hostname,
                                                expiration: '14 months',
                                                description: 'Google Analytics: Distinguishes unique users'
                                            },
                                            {
                                                name: '_ga_*',
                                                domain: window.location.hostname,
                                                expiration: '14 months',
                                                description: 'Google Analytics: Maintains session state'
                                            },
                                            {
                                                name: '_gid',
                                                domain: window.location.hostname,
                                                expiration: '24 hours',
                                                description: 'Google Analytics: Distinguishes users'
                                            }
                                        ]
                                    }
                                },
                                {
                                    title: 'More Information',
                                    description: 'For any questions about our use of cookies, please <a href="mailto:hello@adaptlyhq.com" class="cc-link">contact us</a>.'
                                }
                            ]
                        }
                    }
                }
            },

            // =====================================================================
            // EVENT CALLBACKS
            // =====================================================================

            /**
             * Called on first consent action
             */
            onFirstConsent: function({ cookie }) {
                debugLog('First consent given:', cookie);
                handleConsentChange(cookie);
            },

            /**
             * Called when consent changes
             */
            onConsent: function({ cookie }) {
                debugLog('Consent status:', cookie);
                handleConsentChange(cookie);
            },

            /**
             * Called when preferences are changed
             */
            onChange: function({ cookie, changedCategories, changedServices }) {
                debugLog('Consent changed:', changedCategories);
                handleConsentChange(cookie);

                // If analytics was removed, disable GA4
                if (changedCategories.includes('analytics') && !CookieConsent.acceptedCategory('analytics')) {
                    disableGA4();
                }
            }
        });

        debugLog('Cookie Consent initialized');
    }

    /**
     * Handle consent changes and update GA4 accordingly
     * @param {Object} cookie - Cookie consent object
     */
    function handleConsentChange(cookie) {
        const analyticsAccepted = CookieConsent.acceptedCategory('analytics');

        // Update Google Consent Mode
        updateGoogleConsentMode(analyticsAccepted);

        if (analyticsAccepted) {
            loadGA4();
        } else {
            disableGA4();
        }
    }

    // =========================================================================
    // PUBLIC API
    // =========================================================================

    /**
     * Expose useful functions to window for external access
     */
    window.AdaptlyCookieConsent = {
        /**
         * Show the preferences modal
         */
        showPreferences: function() {
            if (typeof CookieConsent !== 'undefined') {
                CookieConsent.showPreferences();
            }
        },

        /**
         * Show the consent modal
         */
        showConsent: function() {
            if (typeof CookieConsent !== 'undefined') {
                CookieConsent.show(true);
            }
        },

        /**
         * Check if a category is accepted
         * @param {string} category - Category name
         * @returns {boolean}
         */
        isAccepted: function(category) {
            if (typeof CookieConsent !== 'undefined') {
                return CookieConsent.acceptedCategory(category);
            }
            return false;
        },

        /**
         * Reset consent and show the modal again
         */
        resetConsent: function() {
            if (typeof CookieConsent !== 'undefined') {
                CookieConsent.reset(true);
                disableGA4();
            }
        },

        /**
         * Get the current consent revision
         */
        getRevision: function() {
            return CONSENT_REVISION;
        }
    };

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCookieConsent);
    } else {
        // DOM already loaded
        initCookieConsent();
    }

})();
