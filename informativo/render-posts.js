// Uso: node render-posts.js dados.json pasta_saida  -> gera post-1.png, post-2.png...
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const D=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));const out=process.argv[3]||'.';fs.mkdirSync(out,{recursive:true});
const tpl=fs.readFileSync(path.join(__dirname,'template-post.html'),'utf8');
const b=await chromium.launch({executablePath:fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':undefined});
const p=await b.newPage({viewport:{width:1080,height:1920}});let bad=[];
for(let i=0;i<D.posts.length;i++){const post=Object.assign({data_extenso:D.data_extenso,n:i+1,total:D.posts.length},D.posts[i]);
const f=path.join(__dirname,'_post.html');fs.writeFileSync(f,tpl.replace('__POST__',JSON.stringify(post)));
await p.goto('file://'+f);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(250);
if(await p.evaluate(()=>{const w=document.getElementById('w');return w.scrollHeight>w.clientHeight+2}))bad.push(i+1);
await p.screenshot({path:path.join(out,`post-${i+1}.png`)});}
await b.close();console.log(bad.length?'TEXTO GRANDE DEMAIS NOS POSTS: '+bad.join(','):'ok');})();
