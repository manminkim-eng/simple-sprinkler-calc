// 간이스프링클러설비 펌프 용량 계산서 매뉴얼 화면 캡처 — usage: node capture_ssp.js <repoDir> <outDir>
// 규격: 1440×900 · DSF 1.25 (영상용 좁은 화면: MM_VW=720 MM_VH=1280 MM_DSF=2) · serviceWorkers block · _marks.json · _example.json(앱 엔진 결과)
// 입력은 앱의 캡처용 창구 window.__mmHyd(setSys · setSegs · setProj · setTab · setShowFormula)로 넣고, 결과는 window.SSPENG.calc(엔진)로 읽는다.
const {chromium}=require(process.env.MM_PW||'playwright');const fs=require('fs');const path=require('path');const {setup,server}=require('./serve');
const repo=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);fs.mkdirSync(out,{recursive:true});
const VW=+(process.env.MM_VW||1440),VH=+(process.env.MM_VH||900),DSF=+(process.env.MM_DSF||1.25),PORT=8910;
const Z={e90:0,e45:0,teeB:0,teeS:0,gate:0,ball:0,angle:0,check:0};
const sg=(o)=>Object.assign({},Z,o);
/* 예제 A = 익산 ○○ 근린생활시설(바닥면적 800㎡) — 일반 2개 × 10분 · 실양정 12 m · 50A · KS D 3507
   예제 B = 근린생활시설 바닥면적 1,200㎡ — 영 별표 4 제1호마목2)가) · 5개 × 20분 · 가압송수장치(2.2.7)
   예제 C = 부설 주차장 — 표준반응형 2개 × 80 L/min × 10분(MANMIN 해석) · 습식 외 방식 */
const EX={"A": {"proj": {"name": "익산시 ○○동 근린생활시설 신축공사", "designer": "김만민", "date": "2026-10-16"}, "sys": {"baseType": "A2", "actualHead": 12, "pumpDia": 50, "pumpEff": 45, "transType": "1", "pipeType": "SCH10"}, "segs": [{"e90": 3, "e45": 0, "teeB": 1, "teeS": 0, "gate": 1, "ball": 0, "angle": 0, "check": 1, "kind": "oth", "flow": 100, "dia": 50, "len": 25}, {"e90": 2, "e45": 0, "teeB": 0, "teeS": 1, "gate": 0, "ball": 0, "angle": 0, "check": 0, "kind": "oth", "flow": 100, "dia": 40, "len": 10}, {"e90": 1, "e45": 0, "teeB": 0, "teeS": 0, "gate": 0, "ball": 0, "angle": 0, "check": 0, "kind": "br", "flow": 50, "dia": 32, "len": 8}]}, "B": {"proj": {"name": "○○ 근린생활시설(바닥면적 1,200㎡) 신축공사", "designer": "김만민", "date": "2026-10-16"}, "sys": {"baseType": "A5", "actualHead": 15, "pumpDia": 65, "pumpEff": 55, "transType": "1", "pipeType": "SCH10"}, "segs": [{"e90": 3, "e45": 0, "teeB": 1, "teeS": 0, "gate": 1, "ball": 0, "angle": 0, "check": 1, "kind": "oth", "flow": 250, "dia": 65, "len": 30}, {"e90": 2, "e45": 0, "teeB": 0, "teeS": 1, "gate": 0, "ball": 0, "angle": 0, "check": 0, "kind": "oth", "flow": 250, "dia": 50, "len": 15}, {"e90": 1, "e45": 0, "teeB": 0, "teeS": 1, "gate": 0, "ball": 0, "angle": 0, "check": 0, "kind": "br", "flow": 150, "dia": 32, "len": 8}, {"e90": 1, "e45": 0, "teeB": 0, "teeS": 0, "gate": 0, "ball": 0, "angle": 0, "check": 0, "kind": "br", "flow": 50, "dia": 25, "len": 4}]}, "C": {"proj": {"name": "○○ 다중이용업소 부설 주차장", "designer": "김만민", "date": "2026-10-16"}, "sys": {"baseType": "AP2", "actualHead": 6, "pumpDia": 50, "pumpEff": 45, "transType": "1", "pipeType": "SCH10"}, "segs": [{"e90": 3, "e45": 0, "teeB": 1, "teeS": 0, "gate": 1, "ball": 0, "angle": 0, "check": 1, "kind": "oth", "flow": 160, "dia": 50, "len": 30}, {"e90": 1, "e45": 0, "teeB": 0, "teeS": 0, "gate": 0, "ball": 0, "angle": 0, "check": 0, "kind": "br", "flow": 160, "dia": 25, "len": 6}]}};
const FREEZE=`(()=>{const T=new Date(2026,9,15,10,0,0).getTime();const D=Date;class F extends D{constructor(...a){if(a.length)super(...a);else super(T);}static now(){return T;}}window.Date=F;window.alert=()=>{};window.confirm=()=>true;try{localStorage.clear();localStorage.setItem('pwa-dismissed','1');}catch(e){}})()`;
const HIDE='#toast,.toast,#pwa-banner,#pwa-install-bar,#ios-guide-modal,.pwa-banner{display:none!important}';
const HELP=`window.__vis=e=>e&&e.getClientRects().length>0;
window.__box=t=>{const h=[...document.querySelectorAll('.box-header,.box-hd')].find(x=>x.textContent.includes(t)&&__vis(x));return h?h.parentElement:null;};
window.__lab=t=>{const l=[...document.querySelectorAll('label')].find(x=>x.textContent.trim().startsWith(t)&&__vis(x));return l?l.parentElement:null;};
window.__card=t=>{const sp=[...document.querySelectorAll('span')].find(x=>x.textContent.trim().startsWith(t)&&__vis(x));return sp?sp.parentElement.parentElement:null;};
window.__row=t=>{const td=[...document.querySelectorAll('#report-zone td')].find(x=>x.textContent.trim()===t&&__vis(x));return td?td.parentElement:null;};
window.__find=sel=>{if(sel.startsWith('box:'))return __box(sel.slice(4));if(sel.startsWith('lab:'))return __lab(sel.slice(4));if(sel.startsWith('card:'))return __card(sel.slice(5));if(sel.startsWith('row:'))return __row(sel.slice(4));
 if(sel.startsWith('nth:')){const [q,i]=sel.slice(4).split('|');return [...document.querySelectorAll(q)].filter(__vis)[+i]||null;}
 for(const s of sel.split(',')){const e=[...document.querySelectorAll(s)].find(__vis);if(e)return e;}return null;};
window.__EX=${JSON.stringify(EX)};
window.__run=(k,tab)=>{const e=__EX[k];__mmHyd.setShowFormula(false);__mmHyd.setProj(e.proj);__mmHyd.setSys(e.sys);__mmHyd.setSegs(e.segs);__mmHyd.setTab(tab||0);window.scrollTo(0,0);};
window.__ex=k=>{const e=__EX[k];const c=SSPENG.calc(e.sys,e.segs);const r={};['A','B','T','Clpm','D','E','F','G','I','Jraw','J','M','N','K','Pkw','Php','Pdis','hiPress','pipePressOK','velOverN'].forEach(x=>r[x]=c[x]);r.btype=c.btype;
 r.seg=c.sdets.map(d=>({fric:d.fric,fl:d.fl,hl:d.hl,vel:d.vel,vlim:d.vlim,velOver:d.velOver}));return {in:e,R:r};};`;
const SHOTS=[
 {id:'s01_overview',pre:"__run('A',0)",clip:'viewport',m:[['.tab-bar-wrap','작업 탭 · 매뉴얼'],['.sum-bar','요약 바'],['box:Ⅰ-0','프로젝트 정보'],['box:Ⅰ-1','시스템 파라미터'],['.formula-fab','계산식 안내']]},
 {id:'s02_header',clip:'nth:.no-print|0',m:[['nth:.tab-bar-wrap button|0','① 데이터 입력'],['nth:.tab-bar-wrap button|1','② 계산 결과'],['nth:.tab-bar-wrap button|2','③ 계산서 출력'],['.tb-manual','📘 매뉴얼'],['.hdr-right','근거 · 공고 · 시행일']]},
 {id:'s03_project',clip:'box:Ⅰ-0',m:[['lab:공사명','공사명'],['lab:설계자','설계자'],['lab:작성일','작성일']]},
 {id:'s04_params',clip:'box:Ⅰ-1',m:[['lab:A. 적용 기준 유형','A. 기준 유형 — 2개 · 10분 / 5개 · 20분 · 주차장'],['.mm-type-note','설비 방식 안내(2.2.7 · 2.11)'],['lab:F. 실양정','실양정'],['lab:K. 펌프 토출구경','펌프 구경'],['lab:K-1. 펌프 효율','펌프 효율'],['lab:L. 동력 전달방식','전달방식'],['lab:배관 종류','배관 종류(C값)']]},
 {id:'s05_segments',clip:'box:Ⅰ-2',crop:1100,m:[['nth:.seg-kind|0','구분 — 가지 / 교차·주'],['nth:#root table tbody tr|0','1구간 — 펌프 토출 50A'],['nth:#root table tbody tr|2','3구간 — 가지배관 32A'],['nth:button|__ADD__','＋ 구간 추가']]},
 {id:'s06_source',pre:"__mmHyd.setTab(1)",wait:800,clip:'box:Ⅱ-1',m:[['card:A. 기준개수','A. 간이헤드 2개'],['card:B. 헤드','B. 50 L/min 이상'],['card:C. 펌프 토출량','C. 펌프 토출량'],['card:D. 수원 용량','D. 2 × 50 × 10 = 1 m³']]},
 {id:'s07_head',clip:'box:Ⅱ-2',m:[['card:E. 실양정','h₁ 실양정'],['card:F. 배관 마찰손실','h₂ 배관 마찰손실'],['card:G. 헤드','h₃ 헤드 10 m'],['card:I. 안전율','안전율 10 %'],['nth:.g-2 > div|1','소계 · 안전율 · 전양정'],['card:S. 토출압력','S 토출압력 — 배관 사용압력'],['card:유속 판정','유속 판정 6 · 10 m/s']]},
 {id:'s08_power',clip:'box:Ⅱ-3',m:[['card:M. 토출량','Q 토출량'],['card:J. 전양정','H 전양정'],['card:O. 전달계수','K 전달계수'],['card:N. 펌프 효율','η 펌프 효율'],['card:P. 이론 출력','P 이론 출력'],['card:Q. 선정 출력','표준 HP']]},
 {id:'s09_b_source',pre:"__run('B',1)",wait:900,clip:'box:Ⅱ-1',m:[['card:A. 기준개수','5개 — 마목2)가) 대상'],['card:C. 펌프 토출량','5 × 50 = 250 L/min'],['card:D. 수원 용량','5 × 50 × 20 = 5 m³']]},
 {id:'s10_b_head',clip:'box:Ⅱ-2',m:[['nth:.g-2 > div|1','전양정'],['card:S. 토출압력','토출압력'],['.mm-prv-note','방수압 · 수조 식']]},
 {id:'s11_c_source',pre:"__run('C',1)",wait:900,clip:'box:Ⅱ-1',m:[['card:B. 헤드','표준반응형 80 L/min'],['card:D. 수원 용량','2 × 80 × 10 = 1.6 m³']]},
 {id:'s11b_c_seg',pre:"__mmHyd.setTab(0)",wait:900,clip:'box:Ⅰ-1',m:[['lab:A. 적용 기준 유형','주차장(일반) 선택'],['.mm-type-note','방식 안내']]},
 {id:'s12_formula',pre:"__run('A',0);setTimeout(()=>__mmHyd.setShowFormula(true),50)",wait:900,fixed:true,clip:'.fml-box',m:[]},
 {id:'s13_formula_src',pre:"[...document.querySelectorAll('.fml-itab')][1].click()",wait:500,fixed:true,clip:'.fml-box',m:[]},
 {id:'s14_formula_head',pre:"[...document.querySelectorAll('.fml-itab')][2].click()",wait:500,fixed:true,clip:'.fml-box',post:"__mmHyd.setShowFormula(false)",m:[]},
 {id:'s15_a4',pre:"__run('A',2)",wait:1500,clip:'viewport',m:[['#btn-jpg','JPG 저장'],['.mm-btn-pdf','인쇄 · PDF'],['#report-zone','A4 계산서']]},
 {id:'s16_a4page',clip:'#report-zone',crop:2600,m:[['row:A','Ⅱ-1 수원 — A ~ D'],['row:E','Ⅱ-2 양정 — E ~ I'],['row:S','S 배관 사용압력'],['row:J','Ⅱ-3 동력 — J ~ P']]},
];

(async()=>{
 const s=await server(repo,PORT);const b=await chromium.launch({args:['--lang=ko-KR'],env:{...process.env,LANG:'ko_KR.UTF-8',LANGUAGE:'ko',LC_ALL:'ko_KR.UTF-8'}});
 const ctx=await b.newContext({viewport:{width:VW,height:VH},deviceScaleFactor:DSF,serviceWorkers:'block',locale:'ko-KR'});await setup(ctx);
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.addInitScript(FREEZE);
 await pg.goto(`http://127.0.0.1:${PORT}/index.html`);await pg.waitForFunction(()=>window.__mmHyd&&window.SSPENG,null,{timeout:20000});await pg.evaluate(()=>document.fonts.ready);await pg.waitForTimeout(1500);
 await pg.addStyleTag({content:HIDE});await pg.evaluate(HELP);
 const addIdx=await pg.evaluate(()=>[...document.querySelectorAll('button')].filter(__vis).findIndex(x=>x.textContent.includes('구간 추가')));
 SHOTS.forEach(S=>S.m.forEach(m=>{m[0]=m[0].replace('__ADD__',addIdx);}));
 const ex={};const meta={};
 for(const S of SHOTS){
  if(S.pre){try{await pg.evaluate(S.pre);}catch(e){errs.push(S.id+' pre '+e.message);}}
  await pg.waitForTimeout(S.wait||700);
  if(S.clip!=='viewport'&&!S.fixed){await pg.evaluate(c=>{const e=__find(c);if(e){window.scrollTo(0,e.getBoundingClientRect().top+scrollY-40);}},S.clip);await pg.waitForTimeout(500);}
  if(S.id==='s01_overview')ex.A=await pg.evaluate("__ex('A')");
  if(S.id==='s09_b_source')ex.B=await pg.evaluate("__ex('B')");
  if(S.id==='s11_c_source')ex.C=await pg.evaluate("__ex('C')");
  if(S.id==='s16_a4page')ex.A_a4=await pg.evaluate(()=>document.getElementById('report-zone').innerText.replace(/\s+/g,' '));
  if(S.id==='s06_source')ex.A_ui=await pg.evaluate(()=>document.querySelector('.sum-bar').innerText.replace(/\s+/g,' '));
  const info=await pg.evaluate(({S,VW,VH})=>{
   const abs=e=>{const r=e.getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,w:r.width,h:r.height};};
   let clip;
   if(S.clip==='viewport'){clip={x:0,y:scrollY,width:VW,height:VH};}
   else{const el=__find(S.clip);if(!el)return {err:'clip '+S.clip};const a=abs(el);clip={x:a.x,y:a.y,width:a.w,height:a.h};
     const P=12;clip={x:Math.max(0,clip.x-P),y:Math.max(0,clip.y-P),width:clip.width+2*P,height:clip.height+2*P};
     if(S.crop&&clip.height>S.crop)clip.height=S.crop;}
   const marks=[];(S.m||[]).forEach(([sel,label],i)=>{const e=__find(sel);if(!e){marks.push({n:i+1,label,miss:sel});return;}const a=abs(e);
     marks.push({n:i+1,label,x:+((a.x-clip.x)/clip.width*100).toFixed(2),y:+((a.y-clip.y)/clip.height*100).toFixed(2),w:+(Math.min(a.w,clip.x+clip.width-a.x)/clip.width*100).toFixed(2),h:+(Math.min(a.h,clip.y+clip.height-a.y)/clip.height*100).toFixed(2)});});
   return {clip,marks};},{S,VW,VH});
  if(info.err){errs.push(S.id+' '+info.err);continue;}
  const c=info.clip;const cl={x:Math.max(0,c.x),y:Math.max(0,c.y),width:Math.min(c.width,VW-Math.max(0,c.x)),height:c.height};
  if(S.clip==='viewport'){await pg.screenshot({path:path.join(out,S.id+'.png'),clip:{x:0,y:0,width:VW,height:VH}});}
  else if(S.fixed){const sx=await pg.evaluate(()=>scrollX),sy=await pg.evaluate(()=>scrollY);await pg.screenshot({path:path.join(out,S.id+'.png'),clip:{x:Math.max(0,c.x-sx),y:Math.max(0,c.y-sy),width:Math.min(c.width,VW),height:Math.min(c.height,VH-Math.max(0,c.y-sy))}});}
  else{try{await pg.screenshot({path:path.join(out,S.id+'.png'),clip:cl,fullPage:true});}catch(e){errs.push(S.id+' shot '+JSON.stringify(cl));continue;}}
  meta[S.id]={w:Math.round(cl.width),h:Math.round(Math.min(cl.height,S.fixed?VH:1e9)),marks:info.marks};
  if(S.post){try{await pg.evaluate(S.post);}catch(e){errs.push(S.id+' post '+e.message);}await pg.waitForTimeout(400);}
 }
 const mctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,serviceWorkers:'block',isMobile:true,hasTouch:true,locale:'ko-KR'});await setup(mctx);
 const mp=await mctx.newPage();await mp.addInitScript(FREEZE);
 await mp.goto(`http://127.0.0.1:${PORT}/index.html`);await mp.waitForFunction(()=>window.__mmHyd,null,{timeout:20000});await mp.waitForTimeout(1500);
 await mp.addStyleTag({content:HIDE});await mp.evaluate(HELP);await mp.evaluate("__run('A',0)");await mp.waitForTimeout(800);
 await mp.evaluate(()=>{const e=__box('Ⅰ-1');window.scrollTo(0,e.getBoundingClientRect().top+scrollY-12);});await mp.waitForTimeout(600);
 await mp.screenshot({path:path.join(out,'s17_mobile_main.png')});meta['s17_mobile_main']={w:390,h:844,marks:[]};
 await mp.evaluate(()=>{__mmHyd.setTab(1);window.scrollTo(0,0);});await mp.waitForTimeout(900);
 await mp.screenshot({path:path.join(out,'s18_mobile_result.png')});meta['s18_mobile_result']={w:390,h:844,marks:[]};
 await mp.evaluate(()=>{__mmHyd.setTab(2);window.scrollTo(0,0);});await mp.waitForTimeout(1500);
 await mp.screenshot({path:path.join(out,'s19_mobile_a4.png')});meta['s19_mobile_a4']={w:390,h:844,marks:[]};
 ex.mobile=await mp.evaluate(()=>({page:document.documentElement.scrollWidth,vw:innerWidth}));
 fs.writeFileSync(path.join(out,'_marks.json'),JSON.stringify(meta,null,1));fs.writeFileSync(path.join(out,'_example.json'),JSON.stringify(ex,null,1));
 const miss=[];Object.entries(meta).forEach(([k,v])=>v.marks.forEach(m=>{if(m.miss)miss.push(k+':'+m.miss);else if(m.x<0||m.y<0||m.x+m.w>100.5||m.y+m.h>100.5||m.w<=0||m.h<=0)miss.push(k+':OUT '+m.label+' '+m.x+','+m.y+','+m.w+','+m.h);}));
 const sh=o=>o&&{A:o.R.A,Q:o.R.Clpm,D:o.R.D,F:o.R.F,J:o.R.J,P:o.R.Pkw,HP:o.R.Php,S:o.R.Pdis,vo:o.R.velOverN};
 console.log(JSON.stringify({A:sh(ex.A),B:sh(ex.B),C:sh(ex.C),mobile:ex.mobile,sizes:Object.fromEntries(Object.entries(meta).map(([k,v])=>[k,v.w+'x'+v.h])),miss,errs:errs.slice(0,15)},null,1));
 await b.close();s.close();
})();
