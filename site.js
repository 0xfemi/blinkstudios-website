(function(){
  var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};

  /* Mobile menu */
  var sheet=$('#sheet'),open=$('#menuOpen'),close=$('#menuClose');
  if(sheet&&open&&close){
    var setMenu=function(v){sheet.hidden=!v;open.setAttribute('aria-expanded',v);document.body.style.overflow=v?'hidden':'';(v?close:open).focus()};
    open.addEventListener('click',function(){setMenu(true)});
    close.addEventListener('click',function(){setMenu(false)});
    sheet.addEventListener('click',function(e){if(e.target.closest('a'))setMenu(false)});
    document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!sheet.hidden)setMenu(false)});
  }

  /* City clocks */
  var box=$('#clocks');
  if(box){
    [['Lagos','Africa/Lagos'],['London','Europe/London'],['New York','America/New_York'],['Kingston','America/Jamaica'],['Johannesburg','Africa/Johannesburg']].forEach(function(c){
      box.insertAdjacentHTML('beforeend','<div class="clock"><span class="city">'+c[0]+'</span><span class="time" data-tz="'+c[1]+'">--:--</span><span class="off" data-tz="'+c[1]+'"></span></div>');
    });
    var tick=function(){
      var now=new Date();
      $$('.time',box).forEach(function(el){try{el.textContent=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:el.dataset.tz}).format(now)}catch(e){}});
      $$('.off',box).forEach(function(el){try{var p=new Intl.DateTimeFormat('en-GB',{timeZone:el.dataset.tz,timeZoneName:'shortOffset'}).formatToParts(now).find(function(x){return x.type==='timeZoneName'});el.textContent=p?p.value.replace('GMT','UTC').replace(/^UTC$/,'UTC+0'):''}catch(e){}});
    };
    tick();setInterval(tick,15000);
  }

  /* Route map: arcs bow upward between cities */
  $$('svg.map').forEach(function(svg){
    var NS='http://www.w3.org/2000/svg';
    var P=function(lon,lat){return[(lon+100)/150*900,(60-lat)/100*600]};
    var el=function(t,a){var e=document.createElementNS(NS,t);for(var k in a)e.setAttribute(k,a[k]);svg.appendChild(e);return e};
    for(var lon=-90;lon<=45;lon+=15){var a=P(lon,60),b=P(lon,-40);el('line',{x1:a[0],y1:a[1],x2:b[0],y2:b[1],'class':'grat'})}
    for(var lat=45;lat>=-30;lat-=15){var a2=P(-100,lat),b2=P(50,lat);el('line',{x1:a2[0],y1:a2[1],x2:b2[0],y2:b2[1],'class':'grat'})}
    var C={lagos:[3.4,6.5,'Lagos','Nigeria','end',16,22],london:[-0.1,51.5,'London','United Kingdom','start',16,-8],ny:[-74,40.7,'New York','United States','start',16,-8],kgn:[-76.8,18,'Kingston','Jamaica','start',16,20],nbo:[36.8,-1.3,'Nairobi','Kenya','end',16,-22],jnb:[28,-26.2,'Johannesburg','South Africa','end',16,30]};
    [['lagos','london',1],['lagos','ny',1],['london','ny',0],['kgn','london',0],['jnb','london',0],['nbo','lagos',0],['kgn','lagos',0]].forEach(function(r,i){
      var p=P(C[r[0]][0],C[r[0]][1]),q=P(C[r[1]][0],C[r[1]][1]);
      var mx=(p[0]+q[0])/2,my=(p[1]+q[1])/2,dx=q[0]-p[0],dy=q[1]-p[1],d=Math.hypot(dx,dy),nx=-dy/d,ny=dx/d;
      if(ny>0){nx=-nx;ny=-ny}
      var path=el('path',{d:'M'+p[0]+' '+p[1]+' Q'+(mx+nx*d*.22)+' '+(my+ny*d*.22)+' '+q[0]+' '+q[1],'class':'route'+(r[2]?' hub':'')});
      path.style.setProperty('--len',path.getTotalLength());path.style.animationDelay=(300+i*140)+'ms';
    });
    Object.keys(C).forEach(function(k){
      var c=C[k],p=P(c[0],c[1]),x=p[0]+(c[4]==='end'?-c[5]:c[5]);
      el('circle',{cx:p[0],cy:p[1],r:9,'class':'ring'});el('circle',{cx:p[0],cy:p[1],r:4,'class':'dot'});
      el('text',{x:x,y:p[1]+c[6],'text-anchor':c[4]}).textContent=c[2].toUpperCase();
      el('text',{x:x,y:p[1]+c[6]+15,'text-anchor':c[4],'class':'sub'}).textContent=c[3];
    });
  });

  /* Chip filters: [data-chips] group filters [data-cat] items inside its target */
  $$('[data-chips]').forEach(function(group){
    var target=$(group.dataset.chips),chips=$$('.chip',group),count=group.dataset.count?$(group.dataset.count):null;
    var apply=function(f){
      chips.forEach(function(x){x.setAttribute('aria-pressed',x.dataset.f===f)});
      var n=0;$$('[data-cat]',target).forEach(function(c){var on=f==='all'||(' '+c.dataset.cat+' ').indexOf(' '+f+' ')>-1;c.hidden=!on;if(on)n++});
      if(count)count.textContent=n+(n===1?' item':' items');
    };
    chips.forEach(function(ch){ch.addEventListener('click',function(){apply(ch.dataset.f)})});
    var h=location.hash.slice(1),hit=chips.filter(function(c){return c.dataset.hash===h})[0];
    apply(hit?hit.dataset.f:'all');
  });

  /* Cohort tabs */
  $$('.tabs').forEach(function(tl){
    var tabs=$$('.tab',tl),imgs=$$('img',tl.nextElementSibling);
    tabs.forEach(function(t){t.addEventListener('click',function(){
      tabs.forEach(function(x){x.setAttribute('aria-selected',x===t)});
      imgs.forEach(function(b){b.style.opacity=b.dataset.c===t.dataset.c?1:0});
    })});
  });

  /* Sub-navigation highlights the section in view */
  var sub=$('.subnav');
  if(sub&&'IntersectionObserver' in window){
    var links=$$('a',sub),map={};
    links.forEach(function(a){var id=a.getAttribute('href').split('#')[1];if(id&&document.getElementById(id))map[id]=a});
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){links.forEach(function(l){l.classList.remove('on')});var a=map[e.target.id];if(a){a.classList.add('on');var ul=a.closest('ul');if(ul){var l=a.offsetLeft-ul.offsetLeft,r=l+a.offsetWidth;if(l<ul.scrollLeft||r>ul.scrollLeft+ul.clientWidth)ul.scrollTo({left:Math.max(0,l-16),behavior:'smooth'})}}}})},{rootMargin:'-45% 0px -50% 0px'});
    Object.keys(map).forEach(function(id){io.observe(document.getElementById(id))});
  }

  /* Mentor directory: search + selects + profile dialog */
  var dir=$('#directory-list');
  if(dir){
    var cards=$$('.mcard',dir),q=$('#m-q'),sels=$$('[data-key]'),cnt=$('#m-count'),empty=$('#m-empty');
    var run=function(){
      var term=(q.value||'').trim().toLowerCase(),n=0;
      cards.forEach(function(c){
        var ok=!term||c.textContent.toLowerCase().indexOf(term)>-1;
        sels.forEach(function(s){if(s.value&&(c.dataset[s.dataset.key]||'').split('|').indexOf(s.value)<0)ok=false});
        c.hidden=!ok;if(ok)n++;
      });
      cnt.textContent=n+(n===1?' mentor':' mentors');empty.hidden=n>0;
    };
    q.addEventListener('input',run);sels.forEach(function(s){s.addEventListener('change',run)});
    var reset=$('#m-reset');if(reset)reset.addEventListener('click',function(){q.value='';sels.forEach(function(s){s.value=''});run()});
    run();
    var dlg=$('#profile');
    cards.forEach(function(c){c.addEventListener('click',function(){
      $('#p-init',dlg).textContent=c.dataset.init;$('#p-name',dlg).textContent=c.dataset.name;
      $('#p-meta',dlg).textContent=c.dataset.role+', '+c.dataset.countryLabel;
      $('#p-exp',dlg).textContent=c.dataset.expertise;
      $('#p-years',dlg).textContent=c.dataset.years;$('#p-credits',dlg).textContent=c.dataset.credits;
      $('#p-bio',dlg).textContent=c.dataset.bio;
      if(dlg.showModal)dlg.showModal();else dlg.setAttribute('open','');
    })});
    $$('[data-close]',dlg).forEach(function(b){b.addEventListener('click',function(){dlg.close?dlg.close():dlg.removeAttribute('open')})});
    dlg.addEventListener('click',function(e){if(e.target===dlg&&dlg.close)dlg.close()});
  }

  /* File drop zones */
  $$('.filezone').forEach(function(z){
    var inp=$('input[type=file]',z),out=$('.file',z);
    var show=function(){out.textContent=inp.files.length?inp.files[0].name+', '+Math.max(1,Math.round(inp.files[0].size/1024))+' KB':'';var f=z.closest('.f');if(f&&inp.files.length)f.classList.remove('bad')};
    inp.addEventListener('change',show);
    ['dragenter','dragover'].forEach(function(t){z.addEventListener(t,function(e){e.preventDefault();z.classList.add('over')})});
    ['dragleave','drop'].forEach(function(t){z.addEventListener(t,function(e){e.preventDefault();z.classList.remove('over')})});
    z.addEventListener('drop',function(e){if(e.dataTransfer.files.length){try{inp.files=e.dataTransfer.files}catch(x){}show()}});
  });

  /* Validation shared by single-page forms (form[data-validate]) and the stepped application */
  window.blinkValidate=function(scope){
    var ok=true,first=null;
    $$('[required]',scope).forEach(function(inp){
      if(inp.closest('[hidden]'))return;
      var f=inp.closest('.f')||inp.closest('.consent'),good;
      if(inp.type==='checkbox'){good=inp.checked}
      else if(inp.type==='file'){good=inp.files.length>0}
      else{var v=inp.value.trim();good=!!v;if(good&&inp.type==='email')good=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);if(good&&inp.type==='url')good=/^https?:\/\/\S+\.\S+/.test(v)}
      if(f)f.classList.toggle('bad',!good);inp.setAttribute('aria-invalid',!good);
      if(!good&&!first)first=inp;ok=ok&&good;
    });
    $$('[data-req-group]',scope).forEach(function(g){
      var good=!!$('input:checked',g),f=g.closest('.f');if(f)f.classList.toggle('bad',!good);
      if(!good){ok=false;first=first||$('input',g)}
    });
    if(first)first.focus();
    return ok;
  };
  document.addEventListener('input',function(e){var f=e.target.closest&&e.target.closest('.f');if(f&&f.classList.contains('bad')&&(e.target.value||'').trim()){f.classList.remove('bad');e.target.removeAttribute('aria-invalid')}});
  document.addEventListener('change',function(e){var f=e.target.closest&&e.target.closest('.f, .consent');if(f&&f.classList.contains('bad')&&(e.target.checked||e.target.type==='file'))f.classList.remove('bad')});

  $$('form[data-validate]').forEach(function(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      if(!window.blinkValidate(form))return;
      var done=$(form.dataset.validate);
      $$('[data-echo]',done).forEach(function(el){var src=form.elements[el.dataset.echo];el.textContent=src?src.value:''});
      var ref=$('[data-ref]',done);if(ref)ref.textContent='Reference  '+ref.dataset.ref+'-'+new Date().getFullYear()+'-'+Math.random().toString(36).slice(2,7).toUpperCase();
      form.hidden=true;done.hidden=false;done.scrollIntoView({behavior:'smooth',block:'start'});
      var h=$('h2',done);if(h){h.setAttribute('tabindex','-1');h.focus({preventScroll:true})}
    });
  });

  /* One-field sign-ups */
  $$('form[data-inline]').forEach(function(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();var inp=$('input',form),msg=$('.inline-msg',form);
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inp.value.trim())){msg.textContent='Enter an email address like name@example.com.';msg.style.color='var(--error)';inp.focus();return}
      msg.style.color='';msg.textContent='Added. We\'ll email '+inp.value.trim()+' when events are announced. (Preview only: nothing is sent.)';inp.value='';
    });
  });
})();

/* Hero: the last phrase of the headline is retyped through a short list. The full sentence is on screen from the first frame. */
(function(){
  var el=document.querySelector('[data-cycle]');
  if(!el||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var span=el.firstElementChild,list=el.dataset.cycle.split('|'),i=list.length-1;
  var temp=document.createElement('textarea');
  list=list.map(function(t){temp.innerHTML=t;return temp.value});
  function wait(ms){return new Promise(function(r){setTimeout(r,ms)})}
  async function run(){
    await wait(2600);
    for(;;){
      var cur=span.textContent;
      for(var n=cur.length;n>=0;n--){span.textContent=cur.slice(0,n);await wait(34)}
      i=(i+1)%list.length;var next=list[i];
      await wait(220);
      for(var k=1;k<=next.length;k++){span.textContent=next.slice(0,k);await wait(62+(next[k-1]===' '?40:0))}
      await wait(next===list[list.length-1]?3600:2200);
    }
  }
  /* Lock the headline height to its tallest phrase, so retyping never grows or shrinks the hero */
  var h1=el.closest('h1');
  function lockHeight(){
    var keep=span.textContent,max=0;
    h1.style.minHeight='';
    list.forEach(function(t){span.textContent=t;max=Math.max(max,h1.getBoundingClientRect().height)});
    span.textContent=keep;
    h1.style.minHeight=Math.ceil(max)+'px';
  }
  lockHeight();
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(lockHeight);
  var rz;window.addEventListener('resize',function(){clearTimeout(rz);rz=setTimeout(lockHeight,120)});
  el.setAttribute('aria-hidden','false');
  el.closest('h1').setAttribute('aria-label',el.closest('h1').textContent.replace(/\s+/g,' ').trim());
  run();
})();

/* Anchor offset: measure the sticky header + sub-menu so section links land exactly below them */
(function(){
  var root=document.documentElement;
  function offset(){
    var h=0,nav=document.querySelector('.nav'),sub=document.querySelector('.subnav');
    if(nav)h+=nav.getBoundingClientRect().height;
    if(sub&&getComputedStyle(sub).position==='sticky')h+=sub.getBoundingClientRect().height;
    root.style.setProperty('--anchor-offset',Math.round(h+16)+'px');
  }
  function land(){
    var id=decodeURIComponent(location.hash.slice(1)),t=id&&document.getElementById(id);
    if(!t)return;var prev=root.style.scrollBehavior;root.style.scrollBehavior='auto';t.scrollIntoView({block:'start'});root.style.scrollBehavior=prev;
  }
  offset();window.addEventListener('resize',offset);
  // after images and fonts settle, re-land on the target so late layout shifts can't push it off
  window.addEventListener('load',function(){offset();if(location.hash)setTimeout(land,60)});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){offset();if(location.hash)land()});
})();
