(function(){
  // Menu no celular
  var btn=document.querySelector('.menu-btn'),nav=document.getElementById('nav');
  if(btn&&nav){btn.addEventListener('click',function(){var o=nav.classList.toggle('open');btn.setAttribute('aria-expanded',o?'true':'false')})}
  var y=document.getElementById('ano');if(y)y.textContent=new Date().getFullYear();

  // Radar: prazos e notícias a partir de noticias.json
  var ROT={critico:'Prazo / obrigação',regulamentacao:'Regulamentação',informativo:'Informativo'};
  function br(iso){var p=iso.split('-');return p[2]+'/'+p[1]+'/'+p[0]}
  function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
  var boxN=document.getElementById('radar-noticias'),boxP=document.getElementById('radar-prazos');
  if(boxN||boxP){
    fetch('noticias.json',{cache:'no-cache'}).then(function(r){return r.json()}).then(function(D){
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
        D.itens.slice().sort(function(a,b){return a.data<b.data?1:-1}).slice(0,lim2).forEach(function(i){
          var c=el('article','news');
          var m=el('div','meta');m.appendChild(el('span','pill '+i.impacto,ROT[i.impacto]||i.impacto));
          if(i.tema)m.appendChild(el('span',null,i.tema));m.appendChild(el('span',null,br(i.data)));c.appendChild(m);
          c.appendChild(el('h3',null,i.titulo));c.appendChild(el('p',null,i.resumo));
          var s=el('div','src');
          if(i.artigo){var a0=el('a',null,'Leia a análise do escritório');a0.href=i.artigo;s.appendChild(a0)}
          (i.fontes||[]).forEach(function(f){var a=el('a',null,'Fonte: '+f.nome);a.href=f.url;a.target='_blank';a.rel='noopener';s.appendChild(a)});
          c.appendChild(s);boxN.appendChild(c);
        });
      }
    }).catch(function(){if(boxN)boxN.appendChild(el('p','note','Não foi possível carregar as notícias agora. Tente recarregar a página.'))});
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
