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
  if(location.hash==='#cadastro')abrir();
})();
