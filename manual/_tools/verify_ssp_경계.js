// 경계값 점검 — node verify_ssp_경계.js ../../index.html
const fs=require('fs');const h=fs.readFileSync(process.argv[2]||'../../index.html','utf8');const a=h.indexOf('<script id="ssp-engine">')+24;
var window=globalThis;eval(h.slice(a,h.indexOf('</script>',a)));
const seg=(o)=>Object.assign({kind:"oth",flow:100,dia:50,len:0,e90:0,e45:0,teeB:0,teeS:0,gate:0,ball:0,angle:0,check:0},o);
const base={baseType:"A2",actualHead:20,pumpDia:65,pumpEff:55,transType:"1",pipeType:"SCH10"};
const T=[];const ck=(n,c)=>T.push([n,c?'✓':'✗']);
const D=k=>sspCalc({...base,baseType:k},[seg({})]).D;
ck('일반 2 × 50 × 10 = 1.0 m³',D('A2')===1);ck('5개 대상 5 × 50 × 20 = 5.0 m³',D('A5')===5);ck('주차장 2 × 80 × 10 = 1.6 m³',Math.abs(D('AP2')-1.6)<1e-12);ck('주차장 5개 5 × 80 × 20 = 8.0 m³',D('AP5')===8);
const fJ=J=>{for(let x=0;x<200;x+=0.01){const r=sspCalc({...base,actualHead:+x.toFixed(2)},[seg({flow:50,dia:200})]);if(r.J===J)return r;}};
/* v6.1.3 — 배관 사용압력 = 체절압력(입력 없으면 정격 × 1.4 — NFPC 103A 제5조②5호 · 소방청 해석 412390) · 경계 J 87.4 m */
let r=fJ(87);ck('J 87 → 체절 1.194 MPa · SCH10 적합',!r.hiPress&&r.pipePressOK&&Math.abs(r.Pshut-1.194)<5e-4);r=fJ(88);ck('J 88 → 체절 1.208 MPa · SCH10 부적합',r.hiPress&&!r.pipePressOK&&Math.abs(r.Pshut-1.208)<5e-4);
r=sspCalc({...base,actualHead:fJ(88).E,pipeType:"SCH40"},[seg({flow:50,dia:200})]);ck('J 88 · SCH40 적합',r.pipePressOK);
r=sspCalc({...base,actualHead:fJ(123).E,shutPress:1.19},[seg({flow:50,dia:200})]);ck('J 123 · 입력 체절 1.19 MPa → SCH10 적합(릴리프 등으로 1.2 미만)',r.shutUser&&!r.hiPress&&r.pipePressOK);
r=sspCalc({...base,shutPress:1.25},[seg({flow:50,dia:200})]);ck('J '+r.J+' · 입력 체절 1.25 MPa → SCH10 부적합',r.shutUser&&r.hiPress&&!r.pipePressOK);
r=sspCalc({...base,actualHead:fJ(88).E,shutPress:-1},[seg({flow:50,dia:200})]);ck('체절 음수 입력 → 정격 × 1.4 적용',!r.shutUser&&Math.abs(r.Pshut-r.Pdis*1.4)<1e-12);
const v=(q,k)=>sspCalc(base,[seg({kind:k,flow:q,dia:25})]).sdets[0];
ck('가지 25A 215 L/min '+v(215,'br').vel.toFixed(3)+' ≤ 6',!v(215,'br').velOver);ck('가지 25A 216 L/min '+v(216,'br').vel.toFixed(3)+' > 6',v(216,'br').velOver);ck('교차·주 25A 216 L/min ≤ 10',!v(216,'oth').velOver);
T.forEach(t=>console.log(t[1],t[0]));console.log(T.filter(t=>t[1]==='✓').length+' / '+T.length);
