/* PUDD site script — plain JS, no dependencies, no network calls.
   1) Language: Thai by default. English via the header button, ?lang=en, or #en.
      Copy lives in data-th / data-en on each element.
   2) Motion: reveal on scroll + the frame demo. Skipped for reduced motion and for #shot
      (#shot shows everything at once, for full-page screenshots; combine as #en-shot,
      add -open to unfold the accordions: #en-shot-open).
   The page stays complete if this file never runs. */
(() => {
  const root = document.documentElement;
  root.classList.add('js'); /* document pages show both languages until this runs */
  const tokens = (location.hash || '').toLowerCase().replace('#', '').split(/[^a-z]+/);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const still = tokens.includes('shot') || reduced.matches;
  if (still) root.classList.add('no-motion');
  /* #open (or #shot-open) unfolds every accordion, for proofreading. */
  if (tokens.includes('open')) document.querySelectorAll('details').forEach(d => { d.open = true; });

  /* ── Language ── */
  const KEY = 'pudd-lang';
  const recall = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const remember = value => { try { localStorage.setItem(KEY, value); } catch (e) { /* private mode: fine */ } };
  const valid = value => value === 'th' || value === 'en';

  function firstLanguage() {
    const query = new URLSearchParams(location.search).get('lang');
    if (valid(query)) return query;
    if (tokens.includes('en')) return 'en';
    if (tokens.includes('th')) return 'th';
    const saved = recall();
    return valid(saved) ? saved : 'th';
  }

  let lang = 'th';
  const button = document.getElementById('language');

  function setLanguage(next) {
    lang = next;
    const cap = lang === 'th' ? 'Th' : 'En';
    root.lang = lang;
    document.querySelectorAll('[data-th]').forEach(el => { el.innerHTML = el.dataset[lang]; });
    /* Product screenshots: the app has a Thai and an English UI — show the matching set. */
    document.querySelectorAll('[data-src-th]').forEach(el => { const v = el.dataset['src' + cap]; if (el.getAttribute('src') !== v) el.setAttribute('src', v); });
    document.querySelectorAll('[data-srcset-th]').forEach(el => { el.srcset = el.dataset['srcset' + cap]; });
    document.querySelectorAll('[data-size-th]').forEach(el => { const [w, h] = el.dataset['size' + cap].split(' '); el.width = +w; el.height = +h; });
    document.querySelectorAll('[data-alt-th]').forEach(el => { el.alt = el.dataset['alt' + cap]; });
    document.querySelectorAll('[data-label-th]').forEach(el => { el.setAttribute('aria-label', el.dataset['label' + cap]); });
    document.querySelectorAll('[data-content-th]').forEach(el => { el.setAttribute('content', el.dataset['content' + cap]); });
    /* Carry the language across the three pages. */
    document.querySelectorAll('a[data-page]').forEach(a => { a.href = a.dataset.page + (lang === 'en' ? '?lang=en' : '') + (a.dataset.anchor || ''); });
    if (button) {
      button.innerHTML = (lang === 'th' ? 'EN' : 'ไทย') + ' <span aria-hidden="true">↗</span>';
      button.setAttribute('aria-label', lang === 'th' ? 'Switch to English' : 'เปลี่ยนเป็นภาษาไทย');
    }
  }

  /* ── Frame demo: eight real frames, three beats ── */
  const demo = document.getElementById('demo');
  if (demo) {
    const frames = [...demo.querySelectorAll('.demo-frame img')];
    const captions = [...demo.querySelectorAll('.demo-caption > span')];
    const steps = [...demo.querySelectorAll('.demo-steps button')];
    const count = document.getElementById('demo-count');
    const progress = document.getElementById('demo-progress');
    const replay = document.getElementById('demo-replay');
    const beats = [[0, 1], [2, 3, 4, 5], [6, 7]];
    const hold = [900, 1100, 800, 800, 800, 1500, 1900, 1600];
    const rest = [1, 5, 6]; /* the frame each beat settles on when motion is off */
    let current = 5, timer = 0;

    function show(index) {
      current = index;
      frames.forEach((img, i) => img.classList.toggle('active', i === index));
      captions.forEach((span, i) => span.classList.toggle('active', i === index));
      count.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(frames.length).padStart(2, '0');
      progress.style.width = ((index + 1) / frames.length * 100) + '%';
      const beat = beats.findIndex(list => list.includes(index));
      steps.forEach((step, i) => { step.setAttribute('aria-selected', String(i === beat)); step.tabIndex = i === beat ? 0 : -1; });
    }
    function play(list) {
      clearTimeout(timer);
      let i = 0;
      (function next() {
        show(list[i]);
        if (++i < list.length) timer = setTimeout(next, hold[list[i - 1]]);
      })();
    }
    steps.forEach((step, i) => {
      step.addEventListener('click', () => { if (still) { clearTimeout(timer); show(rest[i]); } else play(beats[i]); });
      step.addEventListener('keydown', e => {
        if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
        e.preventDefault();
        const to = e.key === 'Home' ? 0 : e.key === 'End' ? 2 : (i + (['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : 2)) % 3;
        steps[to].focus(); steps[to].click();
      });
    });
    if (still) { replay.dataset.th = 'เฟรมถัดไป →'; replay.dataset.en = 'Next frame →'; }
    replay.addEventListener('click', () => {
      if (still) show((current + 1) % frames.length); else play(frames.map((_, i) => i));
    });
    show(current);
    /* Play once, the first time the demo scrolls into view. */
    if (!still && 'IntersectionObserver' in window) {
      const once = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        once.disconnect();
        play(frames.map((_, i) => i));
      }, { threshold: .55 });
      once.observe(demo.querySelector('.demo-frame'));
    }
  }

  if (button) button.addEventListener('click', () => { const next = lang === 'th' ? 'en' : 'th'; setLanguage(next); remember(next); });
  setLanguage(firstLanguage());

  /* ── Entrances ── */
  if (!still) {
    const title = document.querySelector('.hero h1, .doc-head h1');
    if (title) title.classList.add('type-arrive');
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }), { threshold: .08 });
      document.querySelectorAll('.section-heading,.demo,.feature-card,.capsule-showcase,.privacy-grid,.panel-layout,.price-card,.buy-steps-wrap,.spec-layout,.plain-notes,.faq,.contact-copy,.contact-card,.signature,.doc-content section').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
      });
    }
  }
})();
