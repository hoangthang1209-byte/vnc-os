(function(){
  const menu=document.querySelector('.menu-toggle'),nav=document.querySelector('.nav-links');
  if(menu&&nav){
    const close=()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false')};
    menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){close();menu.focus()}});
    document.addEventListener('click',e=>{if(nav.classList.contains('open')&&!nav.contains(e.target)&&!menu.contains(e.target))close()});
    window.addEventListener('resize',()=>{if(window.innerWidth>760)close()});
  }
  if(!window.matchMedia('(prefers-reduced-motion:reduce)').matches&&'IntersectionObserver' in window){
    const els=document.querySelectorAll('.reveal');
    const ob=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');ob.unobserve(e.target)}}),{threshold:.09});
    els.forEach(el=>ob.observe(el));
  }else{document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'))}
  const host=document.getElementById('approved-gallery');
  if(host){
    fetch('./media-gallery.json').then(r=>r.ok?r.json():null).then(data=>{
      const assets=(data&&Array.isArray(data.assets)?data.assets:[]).filter(a=>{
        try{return a.approved===true&&a.visibility==='PUBLIC'&&new URL(a.url).protocol==='https:'&&typeof a.alt==='string'&&a.alt.trim()}catch{return false}
      });
      if(assets.length){
        host.replaceChildren();
        assets.forEach(a=>{
          const f=document.createElement('figure'),i=document.createElement('img');
          i.src=a.url;i.alt=a.alt;i.loading='lazy';i.decoding='async';
          f.appendChild(i);const c=document.createElement('figcaption');c.textContent=a.caption||a.alt;f.appendChild(c);host.appendChild(f);
        });
      }
    }).catch(()=>{});
  }
})();
