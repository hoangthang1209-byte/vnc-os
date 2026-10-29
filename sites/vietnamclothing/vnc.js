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
  document.addEventListener('click',e=>{const link=e.target.closest('a[href*="contact.html"]');if(link&&window.dataLayer)window.dataLayer.push({event:'vnc_cta_click',cta_destination:'contact'});});

  // Conversion handoff: preselect category from a discovery-card CTA, no personal data in URL or analytics.
  const selected=new URLSearchParams(location.search).get('category');
  const field=document.querySelector('select[name="category"]');
  if(selected&&field&&selected.length<100){
    const option=[...field.options].find(o=>o.value.toLowerCase()===selected.toLowerCase()||o.text.toLowerCase()===selected.toLowerCase());
    if(option)field.value=option.value;
  }
  const selectedProduct=new URLSearchParams(location.search).get('product');
  const productRef=document.getElementById('product-reference');
  if(productRef&&selectedProduct&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(selectedProduct)&&selectedProduct.length<=100){productRef.value=selectedProduct;}
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

/* Compact locale switch; never present a language as an ordinary nav item. */
(function(){const vi=location.pathname.includes('/vi/');document.querySelectorAll('.site-header .nav-links').forEach(nav=>{nav.querySelectorAll('a').forEach(a=>{if(a.textContent.trim()==='Tiếng Việt'||a.textContent.trim()==='English')a.remove()});const switcher=document.createElement('span');switcher.className='locale-switch';switcher.setAttribute('aria-label','Language / Ngôn ngữ');const isIndex=/\/(?:vi\/)?(?:index\.html)?$/.test(location.pathname);const page=location.pathname.match(/\/(catalog|product|solutions|entertainment|promotional-merchandise|corporate-gifts|product-sourcing|apparel-oem|contact|insights|insight)\.html$/)?.[1];const tail=page?(page+'.html'+((page==='product'||page==='insight')?location.search:'')):'index.html';const en=vi?'../'+tail:'./'+tail;const vn=vi?'./'+tail:'./vi/'+tail;switcher.innerHTML='<a lang="en" hreflang="en" href="'+en+'"'+(!vi?' aria-current="page"':'')+'>EN</a><span aria-hidden="true">/</span><a lang="vi" hreflang="vi" href="'+vn+'"'+(vi?' aria-current="page"':'')+'>VN</a>';nav.insertBefore(switcher,nav.querySelector('.pill'));});})();
