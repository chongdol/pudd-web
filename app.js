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

  /* ── Demo film: real working clips (LINE / Claude / Facebook), three beats ── */
  const demo = document.getElementById('demo');
  const film = document.getElementById('demo-video');
  if (demo && film) {
    const picks = [...demo.querySelectorAll('.demo-pick button')];
    const steps = [...demo.querySelectorAll('.demo-steps button')];
    let beats = picks[0].dataset.beats.split(',').map(Number);
    const mark = () => {
      const t = film.currentTime;
      const beat = t >= beats[2] ? 2 : t >= beats[1] ? 1 : 0;
      steps.forEach((step, i) => { step.setAttribute('aria-selected', String(i === beat)); step.tabIndex = i === beat ? 0 : -1; });
    };
    const run = () => { const started = film.play(); if (started) started.catch(() => {}); };
    film.addEventListener('timeupdate', mark);
    if (still) film.controls = true;
    picks.forEach(pick => pick.addEventListener('click', () => {
      picks.forEach(p => p.setAttribute('aria-pressed', String(p === pick)));
      beats = pick.dataset.beats.split(',').map(Number);
      film.poster = 'assets/demo-' + pick.dataset.clip + '-v2.jpg';
      film.src = 'assets/demo-' + pick.dataset.clip + '-v2.mp4';
      if (!still) run();
    }));
    steps.forEach((step, i) => {
      step.addEventListener('click', () => { film.currentTime = beats[i]; mark(); if (!still) run(); });
      step.addEventListener('keydown', e => {
        if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
        e.preventDefault();
        const to = e.key === 'Home' ? 0 : e.key === 'End' ? 2 : (i + (['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : 2)) % 3;
        steps[to].focus(); steps[to].click();
      });
    });
    mark();
    /* Plays while it is on screen, rests when it is not. */
    if (!still && 'IntersectionObserver' in window) {
      new IntersectionObserver(entries => { if (entries[0].isIntersecting) run(); else film.pause(); }, { threshold: .4 }).observe(film);
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

/* Film band: starts muted as soon as the page opens and loops forever (only #shot holds it still); the button turns the sound on from the start. */
(() => {
  const video = document.querySelector('.film-video');
  const sound = document.querySelector('.film-sound');
  if (!video) return;
  if (location.hash.includes('shot')) { video.autoplay = false; video.pause(); }
  else { const started = video.play(); if (started) started.catch(() => {}); }
  if (sound) {
    video.addEventListener('playing', () => { if (video.muted) sound.hidden = false; });
    sound.addEventListener('click', () => { video.muted = false; video.currentTime = 0; video.play(); sound.hidden = true; });
    video.addEventListener('volumechange', () => { if (!video.muted) sound.hidden = true; });
  }
})();
