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
  // Editorias do Radar (como num jornal). Notícias antigas, sem o campo "editoria", são classificadas pelo tema.
  var EDITORIAS=['Tributário','Reforma Tributária','Simples e MEI','Trabalhista e DP','Previdenciário','Terceiro Setor','Contabilidade','Gestão e Empresas'];
  function editoriaDe(i){
    if(EDITORIAS.indexOf(i.editoria)>=0)return i.editoria;
    var t=((i.tema||'')+' '+(i.titulo||'')).toLowerCase();
    if(/terceiro setor|osc|associa|funda[cç][aã]o|entidades? (religios|imune|benefic)/.test(t))return 'Terceiro Setor';
    if(/simples|mei\b|microempreendedor/.test(t))return 'Simples e MEI';
    if(/reforma|ibs|cbs|imposto seletivo|split|nfs-?e|cgibs/.test(t))return 'Reforma Tributária';
    if(/departamento pessoal|trabalh|fgts|esocial|sal[aá]rio|empregad/.test(t))return 'Trabalhista e DP';
    if(/previd|inss|aposentad/.test(t))return 'Previdenciário';
    if(/contabil|cfc|crc|nbc|cpc/.test(t))return 'Contabilidade';
    if(/gest[aã]o|empreend|neg[oó]cio/.test(t))return 'Gestão e Empresas';
    return 'Tributário';
  }
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
        var lim2=parseInt(boxN.dataset.limite||'99',10),todas=D.itens.slice().sort(ordemSite),pag=20,filtro=new URLSearchParams(location.search).get('editoria')||'';
        if(EDITORIAS.indexOf(filtro)<0)filtro='';
        var chips=document.getElementById('radar-editorias'),mais=el('button','btn btn-line mais-noticias','Ver mais notícias');mais.type='button';
        function cartao(i){
          var c=el('article','news');
          var m=el('div','meta');m.appendChild(el('span','pill '+i.impacto,ROT[i.impacto]||i.impacto));
          var ed=editoriaDe(i);m.appendChild(el('span','editoria',ed));
          if(i.tema&&i.tema!==ed)m.appendChild(el('span',null,i.tema));
          m.appendChild(el('span',null,br(noSite(i))));c.appendChild(m);
          var h=el('h3');if(i.id){var hl=el('a',null,i.titulo);hl.href='noticia.html?id='+encodeURIComponent(i.id);h.appendChild(hl)}else h.textContent=i.titulo;
          c.appendChild(h);c.appendChild(el('p',null,i.resumo));
          var s=el('div','src');
          if(i.id){var a1=el('a',null,'Ler a notícia');a1.href='noticia.html?id='+encodeURIComponent(i.id);s.appendChild(a1)}
          if(i.artigo){var a0=el('a',null,'Leia a análise do escritório');a0.href=i.artigo;s.appendChild(a0)}
          c.appendChild(s);return c;
        }
        function desenhar(){
          var lista=todas.filter(function(i){return !filtro||editoriaDe(i)===filtro}).slice(0,lim2);
          boxN.innerHTML='';lista.slice(0,pag).forEach(function(i){boxN.appendChild(cartao(i))});
          if(!lista.length)boxN.appendChild(el('p','note','Ainda não há notícias nesta editoria.'));
          if(mais.parentNode)mais.parentNode.removeChild(mais);
          if(lista.length>pag)boxN.parentNode.insertBefore(mais,boxN.nextSibling);
          if(chips)Array.prototype.forEach.call(chips.children,function(b){b.setAttribute('aria-pressed',b.dataset.ed===filtro?'true':'false')});
        }
        mais.addEventListener('click',function(){pag+=20;desenhar()});
        if(chips){
          var cont={};todas.forEach(function(i){var e=editoriaDe(i);cont[e]=(cont[e]||0)+1});
          [''].concat(EDITORIAS).forEach(function(e){if(e&&!cont[e])return;
            var b=el('button','chip',(e||'Todas')+' ('+(e?cont[e]:todas.length)+')');b.type='button';b.dataset.ed=e;
            b.addEventListener('click',function(){filtro=e;pag=20;var u=new URL(location.href);if(e)u.searchParams.set('editoria',e);else u.searchParams.delete('editoria');history.replaceState(null,'',u);desenhar()});
            chips.appendChild(b)});
        }
        desenhar();
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
      document.getElementById('noticia-eyebrow').textContent='Radar Tributário · '+editoriaDe(n);
      document.getElementById('noticia-titulo').textContent=n.titulo;
      var fs=(n.fontes||[]).filter(function(f){return /^https:\/\//.test(f.url||'')});
      // Assinatura do escritório e data de publicação na fonte ("pela Receita Federal", "pelo Planalto"...)
      var nb=document.getElementById('noticia-byline');if(nb)nb.hidden=false;
      var pp=(n.publicado_por||'').trim(),pd=document.getElementById('noticia-data');
      pd.textContent=n.proprio?'Publicado em '+br(n.data):/^pel[oa]s? \S/i.test(pp)?'Publicado '+pp+' em '+br(n.data):'Publicado na fonte oficial em '+br(n.data);pd.hidden=false;
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
    d.append('entry.1675006329',nome);d.append('entry.2044017432',email);
    d.append('entry.1015147339',perfil);d.append('entry.475540661',CONSENT);
    var b=f.querySelector('button');b.disabled=true;b.textContent='Enviando...';
    fetch(URL,{method:'POST',mode:'no-cors',body:d}).then(function(){
      f.classList.add('enviado');aviso.textContent='Cadastro recebido, '+nome.split(' ')[0]+'! Nos próximos minutos você recebe um e-mail para confirmar a inscrição. Se não encontrar, confira a caixa de spam ou promoções.';
    }).catch(function(){b.disabled=false;b.textContent='Quero me cadastrar';aviso.textContent='Não foi possível enviar agora. Verifique a sua conexão e tente de novo.'});
  });
})();

// Agenda Tributária (agenda.html): meses em agenda.json; mês atual aberto, seletor para os anteriores
(function(){
  var lista=document.getElementById('ag-lista');if(!lista)return;
  var sel=document.getElementById('ag-mes'),filtros=document.getElementById('ag-filtros'),tit=document.getElementById('ag-titulo'),rod=document.getElementById('ag-rodape');
  var MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  var SEM=['dom','seg','ter','qua','qui','sex','sáb'];
  function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
  function nomeMes(m){var p=m.split('-');return MESES[+p[1]-1]+' de '+p[0]}
  var hoje=new Date();hoje.setHours(0,0,0,0);
  var atual=hoje.getFullYear()+'-'+('0'+(hoje.getMonth()+1)).slice(-2);
  var dados={},tipo='',mes='';
  function desenhar(){
    var M=dados[mes];lista.innerHTML='';if(!M)return;
    tit.textContent='Agenda de '+nomeMes(mes);
    var proximoMarcado=false,ord=M.dias.slice().sort(function(a,b){return a.data<b.data?-1:1});
    // No mês atual, os próximos vencimentos vêm primeiro e os já vencidos ficam no fim
    var fut=ord.filter(function(d){return new Date(d.data+'T00:00:00')>=hoje}),pas=ord.filter(function(d){return new Date(d.data+'T00:00:00')<hoje});
    var titPas=null;if(fut.length&&pas.length){titPas=el('h2','ag-sub','Já vencidos neste mês');}
    fut.concat(pas).forEach(function(d,k){if(titPas&&k===fut.length)lista.appendChild(titPas);
      var itens=d.itens.filter(function(i){return !tipo||i.tipo===tipo});if(!itens.length)return;
      var dt=new Date(d.data+'T00:00:00'),passado=dt<hoje;
      var c=el('article','ag-dia');if(passado)c.classList.add('passado');
      var bx=el('div','ag-data');bx.appendChild(el('span','n gold-text',d.data.slice(8,10)));bx.appendChild(el('span','s',SEM[dt.getDay()]+' · '+MESES[dt.getMonth()].slice(0,3)));
      if(!passado&&!proximoMarcado){proximoMarcado=true;c.classList.add('proximo');bx.appendChild(el('span','tag',+dt===+hoje?'hoje':'próximo'))}
      c.appendChild(bx);
      var ul=el('ul','ag-itens');
      itens.forEach(function(i){
        var li=el('li'),t=el('div','t');t.appendChild(el('span',null,i.t));t.appendChild(el('span','ag-tipo '+i.tipo,i.tipo==='declaracao'?'Declaração':'Pagamento'));li.appendChild(t);
        if(i.d)li.appendChild(el('div','d',i.d));
        var c2=[];if(i.per)c2.push('Período: '+i.per);if(i.c&&i.c!=='—')c2.push('Códigos: '+i.c);
        if(c2.length||i.f){var cc=el('div','c',c2.join(' · '));if(i.f){if(c2.length)cc.appendChild(document.createTextNode(' · '));var fa=el('a',null,'Fonte: '+(i.fn||'oficial'));fa.href=i.f;fa.target='_blank';fa.rel='noopener';cc.appendChild(fa)}li.appendChild(cc)}
        ul.appendChild(li);
      });
      var box=el('div');box.appendChild(ul);
      if(d.fonte){var a=el('a','ag-fonte','Conferir este dia na Receita Federal');a.href=d.fonte;a.target='_blank';a.rel='noopener';box.appendChild(a)}
      c.appendChild(box);lista.appendChild(c);
    });
    if(!lista.children.length)lista.appendChild(el('p','note','Nada deste tipo neste mês.'));
    rod.innerHTML='';
    rod.appendChild(document.createTextNode('Agenda de referência montada pelo escritório a partir da Agenda Tributária oficial (atualizada em '+M.atualizado.split('-').reverse().join('/')+'). Datas podem mudar por ato posterior: antes de pagar ou transmitir, confira na fonte. '));
    (M.fontes||[]).forEach(function(f,k){var a=el('a',null,f.nome);a.href=f.url;a.target='_blank';a.rel='noopener';if(k)rod.appendChild(document.createTextNode(' · '));rod.appendChild(a)});
    Array.prototype.forEach.call(filtros.children,function(b){b.setAttribute('aria-pressed',b.dataset.t===tipo?'true':'false')});
    var est=document.querySelector('#ag-estados .ag-links');
    if(est){est.innerHTML='';[['rio-de-janeiro','Rio de Janeiro'],['sao-paulo','São Paulo'],['minas-gerais','Minas Gerais'],['espirito-santo','Espírito Santo']].forEach(function(e){
      var a=el('a','btn btn-line',e[1]+' – '+MESES[+mes.slice(5)-1]);a.href='https://www.contadores.cnt.br/agenda-tributaria/estadual/'+e[0]+'/'+mes.slice(0,4)+'/'+mes.slice(5)+'.html';a.target='_blank';a.rel='noopener';est.appendChild(a)})}
  }
  fetch('agenda.json',{cache:'no-cache'}).then(function(r){return r.json()}).then(function(j){
    (j.meses||[]).forEach(function(m){dados[m.mes]=m});
    var ms=Object.keys(dados).sort().reverse();if(!ms.length){lista.innerHTML='';lista.appendChild(el('p','note','A agenda ainda não foi publicada.'));return}
    var q=new URLSearchParams(location.search).get('mes');
    mes=dados[q]?q:(dados[atual]?atual:ms.filter(function(m){return m<=atual})[0]||ms[ms.length-1]);
    ms.forEach(function(m){var o=el('option',null,nomeMes(m)+(m===atual?' (mês atual)':''));o.value=m;sel.appendChild(o)});sel.value=mes;
    sel.addEventListener('change',function(){mes=sel.value;var u=new URL(location.href);if(mes===atual)u.searchParams.delete('mes');else u.searchParams.set('mes',mes);history.replaceState(null,'',u);desenhar()});
    [['','Tudo'],['pagamento','Pagamentos'],['declaracao','Declarações']].forEach(function(x){var b=el('button','chip',x[1]);b.type='button';b.dataset.t=x[0];b.addEventListener('click',function(){tipo=x[0];desenhar()});filtros.appendChild(b)});
    desenhar();
  }).catch(function(){lista.innerHTML='';lista.appendChild(el('p','note','Não foi possível carregar a agenda agora. Tente recarregar a página.'))});
})();

// Página inscricao.html: confirma ou cancela a inscrição pelo link do e-mail (só com clique no botão)
(function(){
  var box=document.getElementById('inscricao-box');if(!box)return;
  var URL_WEB='https://script.google.com/macros/s/AKfycbwqAuBccEqMOOydaS06M9xVGK0mik076iu3MlYETLpGc2cDuNFDL9aBLnnVc31Z3Rdu9g/exec';
  var q=new URLSearchParams(location.search),a=q.get('a'),t=(q.get('t')||'').replace(/[^a-f0-9]/g,'');
  var tit=document.getElementById('insc-titulo'),txt=document.getElementById('insc-texto'),btn=document.getElementById('insc-botao'),msg=document.getElementById('insc-msg'),acao=document.getElementById('insc-acao');
  if(history.replaceState&&location.search)history.replaceState(null,'',location.pathname);
  if((a!=='confirmar'&&a!=='cancelar')||t.length!==32)return;
  if(a==='confirmar'){tit.textContent='Confirme sua inscrição';txt.textContent='Toque no botão para confirmar que deseja receber o Radar Tributário LG por e-mail: no máximo um e-mail por dia útil, só quando houver novidade publicada no site.';btn.textContent='Confirmar minha inscrição'}
  else{tit.textContent='Cancelar inscrição';txt.textContent='Toque no botão para deixar de receber o Radar Tributário LG por e-mail. O cancelamento vale na hora.';btn.textContent='Cancelar minha inscrição'}
  acao.style.display='';
  btn.addEventListener('click',function(){
    btn.disabled=true;btn.textContent='Aguarde...';
    fetch(URL_WEB+'?nl='+a+'&t='+t).then(function(r){return r.json()}).then(function(r){
      acao.style.display='none';msg.textContent='';
      if(r.ok&&r.status==='ativo'){tit.textContent='Inscrição confirmada';txt.textContent='Pronto! Você passa a receber o Radar Tributário LG no seu e-mail sempre que houver novidade no site. Para cancelar, use o link que vem em todos os e-mails.'}
      else if(r.ok&&r.status==='cancelado'){tit.textContent='Inscrição cancelada';txt.textContent='Você não vai mais receber o Radar Tributário LG por e-mail. Se mudar de ideia, é só se cadastrar de novo na página do Radar.'}
      else{tit.textContent='Não foi possível concluir';txt.textContent=r.mensagem||'Tente de novo mais tarde.'}
    }).catch(function(){btn.disabled=false;btn.textContent=a==='confirmar'?'Confirmar minha inscrição':'Cancelar minha inscrição';msg.textContent='Não foi possível falar com o servidor agora. Verifique a sua conexão e tente de novo.'});
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
