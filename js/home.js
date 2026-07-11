/* Adaptly homepage: scroll reveals + hero terminal demo.
   Respects prefers-reduced-motion by rendering final states statically. */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll reveals ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Hero terminal demo ---------- */
  var term = document.getElementById('heroTerminal');
  var stuckFlag = document.getElementById('stuckFlag');
  var hintCard = document.getElementById('hintCard');
  var instructorChip = document.getElementById('instructorChip');
  if (!term || !stuckFlag || !hintCard || !instructorChip) return;

  var PROMPT = 'student@lab-07:~$ ';
  var SCRIPT = [
    { type: 'cmd', text: 'nmap -sV 10.129.4.21' },
    { type: 'out', text: 'PORT     STATE   SERVICE' },
    { type: 'out', text: '22/tcp   closed  ssh' },
    { type: 'ok',  text: '8080/tcp open    http-proxy' },
    { type: 'cmd', text: 'ssh admin@10.129.4.21' },
    { type: 'err', text: 'ssh: connect to host 10.129.4.21 port 22: Connection refused' },
    { type: 'cmd', text: 'ssh admin@10.129.4.21' },
    { type: 'err', text: 'ssh: connect to host 10.129.4.21 port 22: Connection refused' },
    { type: 'idle', text: 'no keystrokes for 4m 12s' }
  ];

  function makeLine(item) {
    var line = document.createElement('span');
    line.className = 't-line t-' + item.type;
    if (item.type === 'cmd') {
      var prompt = document.createElement('span');
      prompt.className = 't-prompt';
      prompt.textContent = PROMPT;
      line.appendChild(prompt);
      var body = document.createElement('span');
      body.className = 't-typed';
      line.appendChild(body);
    } else {
      line.textContent = (item.type === 'idle' ? '⏱ ' : '') + item.text;
    }
    return line;
  }

  function renderStatic() {
    SCRIPT.forEach(function (item) {
      var line = makeLine(item);
      if (item.type === 'cmd') line.querySelector('.t-typed').textContent = item.text;
      term.appendChild(line);
    });
    stuckFlag.classList.add('show');
    hintCard.classList.add('show');
    instructorChip.classList.add('show');
  }

  if (reducedMotion) {
    renderStatic();
    return;
  }

  function sleep(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function typeInto(el, text) {
    return new Promise(function (resolve) {
      var i = 0;
      (function tick() {
        if (i < text.length) {
          el.textContent += text.charAt(i++);
          setTimeout(tick, 26 + Math.random() * 34);
        } else {
          resolve();
        }
      })();
    });
  }

  var caret = document.createElement('span');
  caret.className = 't-caret';

  async function playOnce() {
    term.textContent = '';
    stuckFlag.classList.remove('show');
    hintCard.classList.remove('show');
    instructorChip.classList.remove('show');
    await sleep(600);

    for (var i = 0; i < SCRIPT.length; i++) {
      var item = SCRIPT[i];
      var line = makeLine(item);
      term.appendChild(line);
      if (item.type === 'cmd') {
        var body = line.querySelector('.t-typed');
        line.appendChild(caret);
        await sleep(350);
        await typeInto(body, item.text);
        await sleep(280);
        caret.remove();
      } else {
        await sleep(item.type === 'idle' ? 900 : 160);
      }
    }

    await sleep(500);
    stuckFlag.classList.add('show');
    await sleep(1100);
    hintCard.classList.add('show');
    await sleep(900);
    instructorChip.classList.add('show');
    await sleep(6500);
  }

  (async function loop() {
    while (true) {
      await playOnce();
    }
  })();
})();
