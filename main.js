(function(){
  // Menu no celular
  var btn=document.querySelector('.menu-btn'),nav=document.getElementById('nav');
  if(btn&&nav){btn.addEventListener('click',function(){var o=nav.classList.toggle('open');btn.setAttribute('aria-expanded',o?'true':'false')})}
  var y=document.getElementById('ano');if(y)y.textContent=new Date().getFullYear();

  // Radar: prazos e notícias de noticias.json + publicações aprovadas (planilha assinada)
  var ROT={critico:'Prazo / obrigação',regulamentacao:'Regulamentação',informativo:'Informativo'};
  var PLANILHA='1l5lS56S8rDCjwjwI3XAkOwDksw-lK45Vf66JLofA8_I';
  var CHAVE_PUB='BJ9eM5UlDfEEXGwCjx2cKvNQTfz15mK2NuCqJGU9qTZ5C8zJFAKkST216LpyM9T54XEdgbekbicEfwgRDjpaT7Q=';
  function br(iso){var p=iso.split('-');return p[2]+'/'+p[1]+'/'+p[0]}
  function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
  function csv(t){var L=[],R=[],v='',q=false;for(var k=0;k<t.length;k++){var ch=t[k];if(q){if(ch=='"'){if(t[k+1]=='"'){v+='"';k++}else q=false}else v+=ch}else if(ch=='"')q=true;else if(ch==','){R.push(v);v=''}else if(ch=='\n'){R.push(v);L.push(R);R=[];v=''}else if(ch!='\r')v+=ch}if(v||R.length){R.push(v);L.push(R)}return L}
  function b64(s){var b=atob(s),u=new Uint8Array(b.length);for(var k=0;k<b.length;k++)u[k]=b.charCodeAt(k);return u}
  // Data em que a linha entrou na planilha (= entrada no site): "06/10/2026 10:05:18" -> "2026-10-06"
  function dataPlanilha(t){t=t||'';var m=t.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);if(m)return m[3]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[1]).slice(-2);m=t.match(/(\d{4})-(\d{2})-(\d{2})/);return m?m[0]:''}
  function publicacoes(){
    if(PLANILHA.indexOf('__')===0||!(window.crypto&&crypto.subtle))return Promise.resolve([]);
    var url='https://docs.google.com/spreadsheets/d/'+PLANILHA+'/gviz/tq?tqx=out:csv&t='+Date.now();
    return Promise.all([fetch(url).then(function(r){return r.text()}),crypto.subtle.importKey('raw',b64(CHAVE_PUB),{name:'ECDSA',namedCurve:'P-256'},false,['verify'])]).then(function(x){
      var linhas=csv(x[0]).slice(1),key=x[1],enc=new TextEncoder();
      return Promise.all(linhas.map(function(l,n){var dados=l[1],sig=l[2];if(!dados||!sig)return null;
        return crypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,b64(sig.trim()),enc.encode(dados)).then(function(ok){if(!ok)return null;try{var o=JSON.parse(dados);o._pub=dataPlanilha(l[0]);o._ord=n+1;return o}catch(e){return null}},function(){return null})}));
    }).then(function(a){return a.filter(Boolean)}).catch(function(){return []});
  }
  function juntar(D,P){
    var porId={},prim={};P.forEach(function(p){if(!p.id)return;if(!prim[p.id])prim[p.id]=p._pub;porId[p.id]=p;if(prim[p.id])p._pub=prim[p.id]});
    var rem={};Object.keys(porId).forEach(function(id){if(porId[id].tipo==='remover')rem[id]=1});
    Object.keys(porId).forEach(function(id){var p=porId[id];if(rem[id])return;
      if(p.tipo==='noticia')D.itens=D.itens.filter(function(i){return i.id!==id}).concat([p]);
      if(p.tipo==='prazo')D.prazos=D.prazos.filter(function(i){return i.id!==id}).concat([p]);});
    D.itens=D.itens.filter(function(i){return !rem[i.id]});D.prazos=D.prazos.filter(function(i){return !rem[i.id]});
    return D;
  }
  // Data de entrada no site (notícias fixas do noticias.json usam a própria data) e ordem da lista
  function noSite(i){return i._pub||i.data}
  function ordemSite(a,b){var x=noSite(a),y=noSite(b);if(x!==y)return x<y?1:-1;return (a._ord||0)-(b._ord||0)}
  var boxN=document.getElementById('radar-noticias'),boxP=document.getElementById('radar-prazos');
  if(boxN||boxP){
    Promise.all([fetch('noticias.json',{cache:'no-cache'}).then(function(r){return r.json()}),publicacoes()]).then(function(x){
      var D=juntar(x[0],x[1]);
      var hoje=new Date();hoje.setHours(0,0,0,0);
      if(boxP){
        var ps=D.prazos.filter(function(p){return new Date(p.data+'T00:00:00')>=hoje}).sort(function(a,b){return a.data<b.data?-1:1});
        var lim=parseInt(boxP.dataset.limite||'99',10);
        ps.slice(0,lim).forEach(function(p){
          var dias=Math.round((new Date(p.data+'T00:00:00')-hoje)/864e5);
          var c=el('div','prazo');
          var d=el('span','d gold-text',br(p.data).slice(0,5));c.appendChild(d);
          c.appendChild(el('span','t',p.texto));
          c.appendChild(el('span','n',dias===0?'é hoje':dias===1?'amanhã':'faltam '+dias+' dias'));
          boxP.appendChild(c);
        });
        if(!ps.length)boxP.appendChild(el('p','note','Nenhum prazo próximo registrado.'));
      }
      if(boxN){
        var lim2=parseInt(boxN.dataset.limite||'99',10);
        D.itens.slice().sort(ordemSite).slice(0,lim2).forEach(function(i){
          var c=el('article','news');
          var m=el('div','meta');m.appendChild(el('span','pill '+i.impacto,ROT[i.impacto]||i.impacto));
          if(i.tema)m.appendChild(el('span',null,i.tema));m.appendChild(el('span',null,br(noSite(i))));c.appendChild(m);
          var h=el('h3');if(i.id){var hl=el('a',null,i.titulo);hl.href='noticia.html?id='+encodeURIComponent(i.id);h.appendChild(hl)}else h.textContent=i.titulo;
          c.appendChild(h);c.appendChild(el('p',null,i.resumo));
          var s=el('div','src');
          if(i.id){var a1=el('a',null,'Ler a notícia');a1.href='noticia.html?id='+encodeURIComponent(i.id);s.appendChild(a1)}
          if(i.artigo){var a0=el('a',null,'Leia a análise do escritório');a0.href=i.artigo;s.appendChild(a0)}
          c.appendChild(s);boxN.appendChild(c);
        });
      }
    }).catch(function(){if(boxN)boxN.appendChild(el('p','note','Não foi possível carregar as notícias agora. Tente recarregar a página.'))});
  }

  // Artigos publicados pela aprovação por e-mail (planilha assinada): lista em artigos.html e página artigo.html?id=...
  var listaA=document.getElementById('lista-artigos'),boxA=document.getElementById('artigo-dinamico');
  function limpar(html){
    var OK={P:1,H2:1,H3:1,UL:1,OL:1,LI:1,STRONG:1,EM:1,B:1,I:1,A:1,BR:1,TABLE:1,THEAD:1,TBODY:1,TR:1,TH:1,TD:1,DIV:1,SPAN:1,BLOCKQUOTE:1};
    var doc=new DOMParser().parseFromString('<div>'+html+'</div>','text/html'),raiz=doc.body.firstChild;
    (function lim(n){Array.prototype.slice.call(n.childNodes).forEach(function(c){
      if(c.nodeType===3)return;
      if(c.nodeType!==1||!OK[c.tagName]){if(c.nodeType===1&&!/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED|FORM)$/.test(c.tagName)){lim(c);while(c.firstChild)n.insertBefore(c.firstChild,c)}n.removeChild(c);return}
      Array.prototype.slice.call(c.attributes).forEach(function(at){
        var k=at.name.toLowerCase();
        if(k==='class'&&/^(box|table-wrap|note)$/.test(at.value))return;
        if(k==='href'&&c.tagName==='A'&&(/^https:\/\//.test(at.value)||/^[a-z0-9\-]+\.html([#?][\w\-=&#]*)?$/i.test(at.value)))return;
        c.removeAttribute(at.name)});
      if(c.tagName==='A'&&/^https:/.test(c.getAttribute('href')||'')){c.target='_blank';c.rel='noopener'}
      lim(c)})})(raiz);
    return raiz.innerHTML;
  }
  function artigosAssinados(P){
    var rem={},grupos={};P.forEach(function(p){if(p.tipo==='remover'&&p.id)rem[p.id]=1});
    P.forEach(function(p){if(p.tipo!=='artigo'||!p.id||rem[p.id])return;(grupos[p.id]=grupos[p.id]||{})[p.parte||1]=p});
    return Object.keys(grupos).map(function(id){var g=grupos[id],c=g[1];if(!c)return null;var n=c.partes||1;
      for(var k=1;k<=n;k++)if(!g[k])return null;
      var html='';for(var j=1;j<=n;j++)html+=g[j].html||'';
      return {id:id,data:c.data||'',tema:c.tema||'',titulo:c.titulo||'',resumo:c.resumo||'',lead:c.lead||'',html:html}}).filter(Boolean);
  }
  var homeA=document.getElementById('home-artigos');
  if(homeA){
    Promise.all([fetch('artigos.json',{cache:'no-cache'}).then(function(r){return r.json()}).catch(function(){return []}),publicacoes()]).then(function(x){
      var est=x[0].map(function(a){return {href:a.url,data:a.data,tema:a.tema,titulo:a.titulo,resumo:a.resumo}});
      var ass=artigosAssinados(x[1]).map(function(a){return {href:'artigo.html?id='+encodeURIComponent(a.id),data:a.data,tema:a.tema,titulo:a.titulo,resumo:a.resumo}});
      var lim=parseInt(homeA.dataset.limite||'4',10);
      ass.concat(est).sort(function(a,b){return a.data<b.data?1:-1}).slice(0,lim).forEach(function(a){
        var c=el('a','card');c.href=a.href;c.style.textDecoration='none';c.style.color='inherit';
        c.appendChild(el('span','eyebrow',(a.tema?a.tema+' · ':'')+(a.data?br(a.data):'')));c.appendChild(el('h3',null,a.titulo));c.appendChild(el('p',null,a.resumo));
        var l=el('span',null,'Ler artigo');l.style.color='var(--gold-2)';c.appendChild(l);homeA.appendChild(c)});
      if(!homeA.children.length)homeA.appendChild(el('p','note','Os artigos do escritório aparecem aqui.'));
    });
  }
  if(listaA||boxA){
    publicacoes().then(function(P){
      var A=artigosAssinados(P);
      if(listaA){A.sort(function(a,b){return a.data<b.data?1:-1}).forEach(function(a){
        var c=el('a','card');c.href='artigo.html?id='+encodeURIComponent(a.id);c.style.textDecoration='none';c.style.color='inherit';
        c.appendChild(el('span','eyebrow',(a.tema?a.tema+' · ':'')+(a.data?br(a.data):'')));c.appendChild(el('h3',null,a.titulo));c.appendChild(el('p',null,a.resumo));
        var l=el('span',null,'Ler artigo');l.style.color='var(--gold-2)';c.appendChild(l);listaA.insertBefore(c,listaA.firstChild)})}
      if(boxA){
        var id=new URLSearchParams(location.search).get('id'),a=A.filter(function(x){return x.id===id})[0];
        if(!a){boxA.innerHTML='';boxA.appendChild(el('p',null,'Artigo não encontrado. Veja a lista completa em '));var v=el('a',null,'Artigos');v.href='artigos.html';boxA.firstChild.appendChild(v);return}
        document.title=a.titulo+' | LG Serviços Contábeis';
        var m=document.querySelector('meta[name="description"]');if(m)m.setAttribute('content',a.resumo);
        document.getElementById('artigo-eyebrow').textContent=(a.tema?a.tema+' · ':'')+(a.data?br(a.data):'');
        document.getElementById('artigo-titulo').textContent=a.titulo;
        document.getElementById('artigo-lead').textContent=a.lead||a.resumo;
        boxA.innerHTML=limpar(a.html);
        // Assinatura do autor: linha abaixo do título e bloco no fim do artigo (antes das fontes)
        var by=document.getElementById('artigo-byline'),ass=document.getElementById('artigo-assinatura');
        if(by)by.hidden=false;
        if(ass){var nts=boxA.querySelectorAll('p.note'),ult=nts[nts.length-1];if(ult&&ult.parentNode===boxA)boxA.insertBefore(ass,ult);else boxA.appendChild(ass);ass.hidden=false}
      }
    });
  }

  // Página de uma notícia do Radar: título, data de publicação na fonte, texto e, no fim, o link oficial
  var boxNo=document.getElementById('noticia-corpo');
  if(boxNo){
    Promise.all([fetch('noticias.json',{cache:'no-cache'}).then(function(r){return r.json()}),publicacoes()]).then(function(x){
      var D=juntar(x[0],x[1]),id=new URLSearchParams(location.search).get('id'),n=D.itens.filter(function(i){return i.id===id})[0];
      boxNo.innerHTML='';
      if(!n){document.getElementById('noticia-titulo').textContent='Notícia não encontrada';var p0=el('p',null,'Veja todas as notícias no ');var v=el('a',null,'Radar Tributário');v.href='noticias.html';p0.appendChild(v);boxNo.appendChild(p0);return}
      document.title=n.titulo+' | Radar Tributário | LG Serviços Contábeis';
      var md=document.querySelector('meta[name="description"]');if(md)md.setAttribute('content',n.resumo);
      document.getElementById('noticia-eyebrow').textContent='Radar Tributário'+(n.tema?' · '+n.tema:'');
      document.getElementById('noticia-titulo').textContent=n.titulo;
      var fs=(n.fontes||[]).filter(function(f){return /^https:\/\//.test(f.url||'')});
      var pd=document.getElementById('noticia-data');pd.textContent='Publicado em '+br(n.data)+(fs[0]?' · '+fs[0].nome:'');pd.hidden=false;
      if(n.texto)boxNo.innerHTML=limpar(n.texto);else boxNo.appendChild(el('p',null,n.resumo));
      if(n.artigo){var bx=el('div','box'),pa=el('p',null,'Quer a análise completa? ');var aa=el('a',null,'Leia o artigo do escritório');aa.href=n.artigo;pa.appendChild(aa);bx.appendChild(pa);boxNo.appendChild(bx)}
      if(fs.length){var pf=el('p','fonte-oficial');pf.appendChild(el('strong',null,fs.length>1?'Fontes oficiais: ':'Fonte oficial: '));
        fs.forEach(function(f,k){if(k)pf.appendChild(document.createTextNode(' · '));var a=el('a',null,f.nome);a.href=f.url;a.target='_blank';a.rel='noopener';pf.appendChild(a)});boxNo.appendChild(pf)}
    }).catch(function(){boxNo.innerHTML='';boxNo.appendChild(el('p','note','Não foi possível carregar a notícia agora. Tente recarregar a página.'))});
  }

  // Formulário de contato: monta a mensagem e abre o WhatsApp (nada é armazenado no site)
  var f=document.getElementById('form-contato');
  if(f){f.addEventListener('submit',function(ev){
    ev.preventDefault();
    var nome=f.nome.value.trim(),assunto=f.assunto.value,msg=f.mensagem.value.trim();
    if(!nome||!msg){document.getElementById('form-aviso').textContent='Preencha seu nome e a mensagem.';return}
    var num=assunto==='Perícia ou assistência técnica'?'5521964037061':'5521970021670';
    var txt='Olá, LG Serviços Contábeis! Meu nome é '+nome+'.\nAssunto: '+assunto+'\n\n'+msg;
    window.open('https://wa.me/'+num+'?text='+encodeURIComponent(txt),'_blank','noopener');
    document.getElementById('form-aviso').textContent='Abrimos o WhatsApp com a sua mensagem. É só tocar em enviar.';
  })}
})();

// Cadastro no Radar Tributário: envia para o Google Formulários do escritório
(function(){
  var f=document.getElementById('form-radar');if(!f)return;
  var aviso=document.getElementById('radar-aviso');
  var URL='https://docs.google.com/forms/d/e/1FAIpQLSffA4qdro9zl7PSr3W__dp3M0A0Dd-WlUu0wTuc-14967X9Vw/formResponse';
  var CONSENT='Sim, autorizo a LG Serviços Contábeis a usar meus dados para enviar atualizações e sei que posso cancelar a qualquer momento.';
  f.addEventListener('submit',function(ev){
    ev.preventDefault();
    var nome=f.nome.value.trim(),email=f.email.value.trim(),perfil=f.perfil.value;
    if(!nome||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||!perfil){aviso.textContent='Preencha nome, um e-mail válido e selecione o seu perfil.';return}
    if(!f.lgpd.checked){aviso.textContent='Para receber as atualizações, marque a autorização de uso dos dados.';return}
    var d=new URLSearchParams();
    d.append('entry.1675006329',nome);d.append('entry.2044017432',email);d.append('entry.78537103',f.whats.value.trim());
    d.append('entry.1015147339',perfil);d.append('entry.475540661',CONSENT);
    var b=f.querySelector('button');b.disabled=true;b.textContent='Enviando...';
    fetch(URL,{method:'POST',mode:'no-cors',body:d}).then(function(){
      f.classList.add('enviado');aviso.textContent='Cadastro recebido, '+nome.split(' ')[0]+'! Assim que o escritório confirmar, você passa a receber o Radar Tributário no seu e-mail.';
    }).catch(function(){b.disabled=false;b.textContent='Quero me cadastrar';aviso.textContent='Não foi possível enviar agora. Verifique a sua conexão e tente de novo.'});
  });
})();

// Janela do cadastro: abre pelo botão do Radar ou pelo link #cadastro
(function(){
  var d=document.getElementById('cadastro');if(!d||typeof d.showModal!=='function')return;
  function abrir(ev){if(ev)ev.preventDefault();if(!d.open)d.showModal();var n=document.getElementById('r-nome');if(n&&!d.querySelector('.enviado'))setTimeout(function(){n.focus()},60)}
  document.querySelectorAll('[data-abrir-cadastro],a[href="#cadastro"],a[href="index.html#cadastro"]').forEach(function(a){a.addEventListener('click',abrir)});
  d.querySelectorAll('[data-fechar]').forEach(function(b){b.addEventListener('click',function(){d.close()})});
  d.addEventListener('click',function(ev){if(ev.target===d)d.close()});
  if(location.hash==='#cadastro'&&history.replaceState)history.replaceState(null,'',location.pathname+location.search);
})();

// Estatísticas de acesso: sem cookies e sem dados pessoais; só página, origem e tipo de aparelho
(function(){
  var URL_EST='https://script.google.com/macros/s/AKfycbwqAuBccEqMOOydaS06M9xVGK0mik076iu3MlYETLpGc2cDuNFDL9aBLnnVc31Z3Rdu9g/exec';
  if(URL_EST.indexOf('__')===0)return;
  var q=new URLSearchParams(location.search),interno=false;
  try{
    if(q.get('eu')==='1')localStorage.setItem('lg-interno','1');
    if(q.get('eu')==='0')localStorage.removeItem('lg-interno');
    interno=localStorage.getItem('lg-interno')==='1';
  }catch(e){}
  var o=(q.get('origem')||q.get('utm_source')||'').toLowerCase().replace(/[^a-z0-9\-]/g,'').slice(0,20);
  if((q.has('origem')||q.has('eu'))&&history.replaceState){q.delete('origem');q.delete('eu');var s=q.toString();history.replaceState(null,'',location.pathname+(s?'?'+s:'')+location.hash)}
  if(interno||navigator.webdriver)return;
  var nova=true;try{nova=!sessionStorage.getItem('lg-visita');sessionStorage.setItem('lg-visita','1')}catch(e){}
  if(!o){var r='';try{r=document.referrer?new URL(document.referrer).hostname:''}catch(e){}
    if(r===location.hostname)o='interno';
    else if(/(^|\.)google\./.test(r))o='google';
    else if(/bing\.|duckduckgo|yahoo|ecosia/.test(r))o='outros-buscadores';
    else if(/whatsapp/.test(r))o='whatsapp';
    else if(/instagram/.test(r))o='instagram';
    else if(/facebook|(^|\.)fb\./.test(r))o='facebook';
    else if(/linkedin|lnkd/.test(r))o='linkedin';
    else if(r)o='site-'+r.replace(/^www\./,'').slice(0,40);
    else o='direto';}
  var d=(window.matchMedia&&matchMedia('(pointer:coarse)').matches)||innerWidth<760?'c':'p';
  new Image().src=URL_EST+'?p='+encodeURIComponent(location.pathname)+'&o='+encodeURIComponent(o)+'&d='+d+'&n='+(nova?1:0)+'&t='+Date.now();
})();
