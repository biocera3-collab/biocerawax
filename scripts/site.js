/* Biocera — motion layer */
(function(){
  const palette = localStorage.getItem('biocera-palette') || 'earth';
  document.documentElement.setAttribute('data-palette', palette === 'earth' ? '' : palette);

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

  // ---- Magnetic cursor on .magnetic
  document.querySelectorAll('.magnetic').forEach(el => {
    const strength = parseFloat(el.dataset.magnet) || 0.35;
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width/2);
      const y = e.clientY - (r.top + r.height/2);
      el.style.transform = `translate(${x*strength}px, ${y*strength}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });

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

  // ---- Custom cursor (desktop only)
  if (matchMedia('(hover:hover)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const c = document.createElement('div');
    c.className = 'b-cursor';
    c.innerHTML = '<span class="dot"></span><span class="ring"></span>';
    document.body.appendChild(c);
    let tx=0, ty=0, cx=0, cy=0, rx=0, ry=0;
    window.addEventListener('mousemove', (e) => { tx=e.clientX; ty=e.clientY; });
    function raf(){
      cx += (tx-cx)*0.35; cy += (ty-cy)*0.35;
      rx += (tx-rx)*0.12; ry += (ty-ry)*0.12;
      c.querySelector('.dot').style.transform = `translate(${cx}px, ${cy}px)`;
      c.querySelector('.ring').style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(raf);
    } raf();
    // hover state
    document.querySelectorAll('a, button, .cursor-grow').forEach(el => {
      el.addEventListener('mouseenter', () => c.classList.add('hover'));
      el.addEventListener('mouseleave', () => c.classList.remove('hover'));
    });
  }

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
