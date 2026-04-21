/* Biocera — motion layer */
(function(){
  const palette = localStorage.getItem('biocera-palette') || 'earth';
  document.documentElement.setAttribute('data-palette', palette === 'earth' ? '' : palette);

  // ---- Page fade-in
  function pageReady() { document.body.classList.add('page-ready'); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', pageReady);
  } else {
    requestAnimationFrame(pageReady);
  }

  // ---- Smooth page transitions on internal link clicks
  document.addEventListener('click', function(e) {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    // Skip: external, anchor-only, mailto, tel, target=_blank, js: links
    if (!href || href.startsWith('#') || href.startsWith('mailto:') ||
        href.startsWith('tel:') || href.startsWith('javascript:') ||
        a.target === '_blank' || /^https?:\/\//.test(href)) return;
    e.preventDefault();
    document.body.classList.add('page-leaving');
    setTimeout(function() { window.location.href = href; }, 290);
  }, true);

  // ---- Back button (auto-injected on every page except home)
  (function(){
    const path = window.location.pathname.replace(/\.html$/, '');
    const isHome = (path === '/' || path === '/index' || path === '');
    if (isHome) return;

    // Determine smart fallback URL
    let fallback = '/';
    if (path.includes('/journal/')) fallback = '/blog';
    else if (/\/products\/./.test(path)) fallback = '/products';

    const btn = document.createElement('button');
    btn.className = 'back-btn';
    btn.setAttribute('aria-label', 'Go back');
    btn.innerHTML = '<span class="back-arrow">←</span><span class="back-label">Back</span>';
    btn.addEventListener('click', function() {
      if (history.length > 1 && document.referrer &&
          document.referrer.includes(window.location.hostname)) {
        history.back();
      } else {
        document.body.classList.add('page-leaving');
        setTimeout(function() { window.location.href = fallback; }, 290);
      }
    });
    document.body.appendChild(btn);
  })();

  // ---- Lazy-load images below the fold
  document.querySelectorAll('img:not([loading])').forEach(function(img, i) {
    if (i > 0) img.setAttribute('loading', 'lazy');
  });

  // ---- SplitText: wrap each word in span.word > span.inner so we can translate+rotate
  window.splitText = function(el){
    if (!el || el.dataset.split) return;
    el.dataset.split = '1';
    const html = el.innerHTML;
    // Tokenize preserving <em> tags
    const tmp = document.createElement('div'); tmp.innerHTML = html;
    function walk(node, out){
      node.childNodes.forEach(child => {
        if (child.nodeType === 3) {
          child.textContent.split(/(\s+)/).forEach(tok => {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { out.push({type:'space', txt: tok}); }
            else { out.push({type:'word', txt: tok, parent: null}); }
          });
        } else if (child.nodeType === 1) {
          // wrap em/strong: split contents and mark with wrapper tag
          const tag = child.tagName.toLowerCase();
          child.childNodes.forEach(grand => {
            if (grand.nodeType === 3) {
              grand.textContent.split(/(\s+)/).forEach(tok => {
                if (!tok) return;
                if (/^\s+$/.test(tok)) out.push({type:'space', txt: tok});
                else out.push({type:'word', txt: tok, wrap: tag});
              });
            }
          });
        }
      });
    }
    const tokens = [];
    walk(tmp, tokens);
    el.innerHTML = '';
    tokens.forEach((t, i) => {
      if (t.type === 'space') { el.appendChild(document.createTextNode(' ')); return; }
      const w = document.createElement('span'); w.className = 'word';
      const inner = document.createElement('span'); inner.className = 'w-inner';
      inner.textContent = t.txt;
      if (t.wrap === 'em') inner.classList.add('em');
      w.appendChild(inner);
      w.style.setProperty('--i', i);
      el.appendChild(w);
    });
  };

  // Auto-split everything with data-split
  document.querySelectorAll('[data-split]').forEach(window.splitText);

  // ---- Reveal via IntersectionObserver
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        if (e.target.dataset.once === 'true') io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal, [data-split], .stagger').forEach(el => io.observe(el));


  // ---- Scroll progress + scroll-linked custom props
  let scrollY = 0, ticking = false;
  function onScroll(){
    scrollY = window.scrollY;
    if (!ticking) requestAnimationFrame(update);
    ticking = true;
  }
  function update(){
    const vh = window.innerHeight;
    document.documentElement.style.setProperty('--scroll', scrollY);
    // parallax blocks
    document.querySelectorAll('[data-parallax]').forEach(el => {
      const r = el.getBoundingClientRect();
      const speed = parseFloat(el.dataset.parallax);
      const centerOffset = (r.top + r.height/2) - vh/2;
      el.style.transform = `translate3d(0, ${centerOffset * -speed}px, 0)`;
    });
    // scrub elements (0..1 while in viewport)
    document.querySelectorAll('[data-scrub]').forEach(el => {
      const r = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, 1 - (r.top - 0) / (vh + r.height)));
      el.style.setProperty('--p', p);
    });
    ticking = false;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  update();

  // ---- Tweaks host
  window.initTweaks = function(){
    const panel = document.getElementById('tweaks');
    if (!panel) return;
    panel.querySelectorAll('.sw').forEach(sw => {
      sw.addEventListener('click', ()=>{
        panel.querySelectorAll('.sw').forEach(s=>s.classList.remove('active'));
        sw.classList.add('active');
        const p = sw.dataset.palette;
        localStorage.setItem('biocera-palette', p);
        document.documentElement.setAttribute('data-palette', p === 'earth' ? '' : p);
      });
    });
    panel.querySelectorAll('[data-hero-btn]').forEach(btn => {
      btn.addEventListener('click', ()=>{
        panel.querySelectorAll('[data-hero-btn]').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        const l = btn.dataset.heroBtn;
        localStorage.setItem('biocera-hero', l);
        document.documentElement.setAttribute('data-hero', l);
      });
    });
    const p = localStorage.getItem('biocera-palette') || 'earth';
    panel.querySelectorAll('.sw').forEach(s => s.classList.toggle('active', s.dataset.palette === p));
    const h = localStorage.getItem('biocera-hero') || 'split';
    panel.querySelectorAll('[data-hero-btn]').forEach(b => b.classList.toggle('active', b.dataset.heroBtn === h));
    document.documentElement.setAttribute('data-hero', h);
  };
  window.addEventListener('message', (e) => {
    if (!e.data) return;
    if (e.data.type === '__activate_edit_mode') document.getElementById('tweaks')?.classList.add('open');
    else if (e.data.type === '__deactivate_edit_mode') document.getElementById('tweaks')?.classList.remove('open');
  });
  setTimeout(()=>{ try { window.parent.postMessage({type: '__edit_mode_available'}, '*'); } catch(e){} }, 0);
})();
