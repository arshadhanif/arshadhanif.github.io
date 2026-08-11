const { chromium } = require('playwright-core');
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';const BASE='http://localhost:8099';
(async()=>{
  const b=await chromium.launch({executablePath:EXE});
  const p=await b.newPage({viewport:{width:1280,height:900}});
  const bad=[];
  p.on('response',r=>{if(r.status()>=400)bad.push(r.url()+' HTTP '+r.status());});
  await p.goto(BASE+'/',{waitUntil:'networkidle'});
  console.log('homepage 4xx after fix:', bad.length?bad.join(', '):'NONE ✅');
  await p.goto(BASE+'/resources/',{waitUntil:'networkidle'});
  await p.screenshot({path:'/tmp/qa-shots/resources.png',fullPage:true});
  const comingSoon=await p.getByText('Coming soon').count();
  console.log('Coming soon badges on /resources:', comingSoon);
  await b.close();
})().catch(e=>{console.error(e);process.exit(1);});
