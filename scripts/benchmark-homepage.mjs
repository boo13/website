import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const [buildDir, label, outputDir = 'docs/benchmarks/2026-08-30-homepage'] = process.argv.slice(2);
if (!buildDir || !label) throw new Error('Usage: node scripts/benchmark-homepage.mjs BUILD_DIR LABEL [OUTPUT_DIR]');
const root = resolve(buildDir);
const out = resolve(outputDir);
mkdirSync(out, { recursive: true });
mkdirSync('tmp', { recursive: true });
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const paths = [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^" ]+\.(?:js|css))"/g)].map(m => m[1]))];
const assets = paths.map(path => ({ path, bytes: statSync(root + path).size, gzipBytes: gzipSync(readFileSync(root + path)).length }));
const configs = [
  { name: 'desktop', width: 1440, height: 900, dpr: 1 },
  { name: 'phone', width: 375, height: 812, dpr: 2 },
  { name: 'phone-1x', width: 375, height: 812, dpr: 1 },
  { name: 'tablet', width: 768, height: 1024, dpr: 2 },
  { name: 'compact', width: 1024, height: 768, dpr: 1 },
  { name: 'desktop-2x', width: 1440, height: 900, dpr: 2 },
];
const results = [];
const metadata = { label, capturedAt: new Date().toISOString(), revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), buildDir, method: 'Chromium via playwright-cli; fresh browser contexts; same-origin assets fulfilled from frozen production build; live Adobe/R2; no CPU/network throttling; timings are descriptive lab samples, not production CWV', assets, totals: { initialJsGzip: assets.filter(a=>a.path.endsWith('.js')).reduce((n,a)=>n+a.gzipBytes,0), initialCssGzip: assets.filter(a=>a.path.endsWith('.css')).reduce((n,a)=>n+a.gzipBytes,0) } };
for (const config of configs) {
  const code = `async page => {
    const ctx = await page.context().browser().newContext({viewport:{width:${config.width},height:${config.height}},deviceScaleFactor:${config.dpr}, reducedMotion:'no-preference'});
    const p=await ctx.newPage();
    const errors=[];p.on('pageerror', e=>errors.push(e.message));
    await p.route('https://www.randycounsman.com/**', async route => {
      let name=decodeURIComponent(route.request().url().split('www.randycounsman.com')[1].split('?')[0]);
      if(name.includes('..'))return route.fulfill({status:400,body:'Invalid path'});
      if(name.endsWith('/')) name+='index.html';
      try {await route.fulfill({path:${JSON.stringify(root)}+name});} catch {await route.fulfill({status:404,body:'Not found'});}
    });
    await p.route('**/*.workers.dev/**',route=>route.abort());
    await p.addInitScript(()=>{
      window.__bench={lcp:0,cls:0,longTasks:[]};
      new PerformanceObserver(list=>{for(const e of list.getEntries())window.__bench.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});
      new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.__bench.cls+=e.value;}).observe({type:'layout-shift',buffered:true});
      new PerformanceObserver(list=>{for(const e of list.getEntries())window.__bench.longTasks.push(e.duration);}).observe({type:'longtask',buffered:true});
      document.addEventListener('loadingComplete',()=>window.__bench.preloaderExit=performance.now(),{once:true});
    });
    const cdp=await ctx.newCDPSession(p);await cdp.send('Performance.enable');
    await p.goto('https://www.randycounsman.com/',{waitUntil:'domcontentloaded'});
    await p.waitForFunction(()=>!document.querySelector('.loading-overlay')&&document.fonts.status==='loaded',{},{timeout:30000});
    await p.waitForTimeout(5100);
    const initial=await p.evaluate(()=>({timing:{...window.__bench,fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime},resources:performance.getEntriesByType('resource').map(r=>({url:r.name,initiator:r.initiatorType,transferBytes:r.transferSize,duration:r.duration})),fonts:[...document.fonts].filter(f=>f.status==='loaded').map(f=>({family:f.family,weight:f.weight})),lightboxCards:document.querySelectorAll('.glightbox-video').length,bodyFont:getComputedStyle(document.body).fontFamily}));
    await p.screenshot({path:${JSON.stringify(out+'/'+label+'-'+config.name+'-hero.png')}});
    const cards=await p.locator('.gallery-card').count();
    const images=[];
    for(let i=0;i<cards;i++) {
      await p.evaluate(index=>{
        const section=document.querySelector('.featured-work-section');
        const card=document.querySelectorAll('.gallery-card')[index];
        const sectionTop=section.getBoundingClientRect().top+scrollY;
        const y=innerWidth>1024?sectionTop+Math.max(0,card.offsetLeft-innerWidth*0.15):card.getBoundingClientRect().top+scrollY-100;
        window.scrollTo(0,y);
      },i);
      await p.waitForTimeout(1600);
      await p.locator('.card-thumbnail').nth(i).evaluate(img=>img.decode().catch(()=>{}));
      images.push(await p.locator('.card-thumbnail').nth(i).evaluate(img=>({project:img.closest('.gallery-card').dataset.project,src:img.currentSrc,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,displayWidth:img.clientWidth,displayHeight:img.clientHeight,sizes:img.sizes,srcset:img.srcset})));
      if(i===0)await p.screenshot({path:${JSON.stringify(out+'/'+label+'-'+config.name+'-gallery.png')}});
    }
    await p.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
    await p.waitForTimeout(2200);
    const sample=()=>p.evaluate(()=>({videos:[...document.querySelectorAll('#hero video')].map(v=>({class:v.className,paused:v.paused,time:v.currentTime,frames:v.getVideoPlaybackQuality().totalVideoFrames,top:v.getBoundingClientRect().top})),marquee:document.querySelector('.about-intro__marquee-track')?.style.transform}));
    const a=await sample();const perfA=await cdp.send('Performance.getMetrics');
    await p.waitForTimeout(2000);
    const b=await sample();const perfB=await cdp.send('Performance.getMetrics');
    const names=['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration'];
    const idle={};for(const name of names)idle[name]=perfB.metrics.find(m=>m.name===name).value-perfA.metrics.find(m=>m.name===name).value;
    await p.evaluate(()=>window.scrollTo(0,0));await p.waitForTimeout(2000);
    const returned=await sample();
    await ctx.close();return {config:${JSON.stringify(config)},initial,images,offscreen:{a,b,sampleSeconds:2,mainThreadSeconds:idle},returned,errors};
  }`;
  const script = resolve('tmp', `benchmark-${label}-${config.name}.js`);
  writeFileSync(script, code);
  const raw=execFileSync('playwright-cli',['-s=perf-benchmark','--raw','run-code','--filename',script],{encoding:'utf8',maxBuffer:8*1024*1024,stdio:['ignore','pipe','pipe']});
  let result;
  try {result=JSON.parse(raw.trim());} catch {writeFileSync(resolve(out,`${label}-${config.name}-error.txt`),raw);throw new Error(`Benchmark failed: ${raw.slice(0,1000)}`);}
  for(const img of result.images){const path=decodeURIComponent(img.src.split('www.randycounsman.com')[1]||'');try{img.assetBytes=statSync(root+path).size;}catch{img.assetBytes=null;}}
  results.push(result);
  writeFileSync(resolve(out,`${label}.json`),JSON.stringify({...metadata,results},null,2)+'\n');
  console.log(`${label} ${config.name}: ${result.errors.length} page errors; gallery ${result.images.reduce((n,i)=>n+(i.assetBytes||0),0)} bytes`);
}
