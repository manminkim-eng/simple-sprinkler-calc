# 간이스프링클러 v5.1.0 독립 검증 — 앱 엔진(index.html <script id="ssp-engine"> sspCalc)과 따로 짠 파이썬 구현을 무작위 대조
# usage: python3 -I verify_ssp.py <index.html> [건수]
#  · 원문: NFPC 103A(제2025-25호) 제4조①2호 · 제5조① · 제8조① / NFTC 103A(제2024-58호) 2.1.1.2 · 2.2.1 · 2.5.1 · 2.5.3.3 단서
#  · 유형: 2개 × 10분 · 5개 × 20분(영 별표 4 제1호마목2)가) · 6) · 8)) · 간이헤드 50 / 주차장 표준반응형 80 L/min
#  · KS 강관 내경 = 외경 − 2 × 두께 (KS D 3507 · KS D 3562 Sch40) — 이 파일에서 다시 계산 · 참고값은 앱과 같은 값을 따로 옮겨 적음
import sys,json,math,random,subprocess,os,tempfile
html=open(sys.argv[1],encoding='utf-8').read(); N=int(sys.argv[2]) if len(sys.argv)>2 else 50000
a=html.index('<script id="ssp-engine">')+len('<script id="ssp-engine">'); eng=html[a:html.index('</script>',a)]
TYPE={'A2':(2,50,10),'A5':(5,50,20),'AP2':(2,80,10),'AP5':(5,80,20)}
OD={'3507':{25:(34.0,3.2),32:(42.7,3.5),40:(48.6,3.5),50:(60.5,3.8),65:(76.3,4.2),80:(89.1,4.2),100:(114.3,4.5),125:(139.8,4.5),150:(165.2,5.0),200:(216.3,5.8)},
    '3562':{25:(34.0,3.4),32:(42.7,3.6),40:(48.6,3.7),50:(60.5,3.9),65:(76.3,5.2),80:(89.1,5.5),100:(114.3,6.0),125:(139.8,6.6),150:(165.2,7.1),200:(216.3,8.2)}}
INNER={'SCH10':({d:round(o-2*t,2) for d,(o,t) in OD['3507'].items()},120),'SCH40':({d:round(o-2*t,2) for d,(o,t) in OD['3562'].items()},120),
 'STS':({25:27.6,32:36.8,40:42.8,50:54.8,65:70.0,80:85.0,100:108.2,125:133.4,150:160.0,200:210.0},150),
 'CPVC':({25:26.6,32:35.1,40:40.9,50:52.5,65:62.7,80:79.4,100:101.6,125:127.0,150:154.1,200:203.2},150)}
FIT={25:[0.9,0.54,1.5,0.27,0.18,7.5,4.5,2.0],32:[1.2,0.72,1.8,0.36,0.24,10.5,5.4,2.5],40:[1.5,0.90,2.1,0.45,0.30,13.8,6.5,3.1],50:[2.1,1.20,3.0,0.60,0.39,16.5,8.4,4.0],
 65:[2.4,1.30,3.6,0.75,0.48,19.5,10.2,4.6],80:[3.0,1.80,4.5,0.90,0.60,24.0,12.0,5.7],100:[4.2,2.40,6.3,1.20,0.81,37.5,16.5,7.6],125:[5.1,3.00,7.5,1.50,0.99,42.0,21.0,10.0],
 150:[6.0,3.60,9.0,1.80,1.20,49.5,24.0,12.0],200:[6.5,3.70,14.0,4.00,1.40,70.0,33.0,15.0]}
K={1:1.1,2:1.15}; HP=[3,5,7.5,10,15,20,25,30,40,50,60,75,100,125,150,200]; FK=['e90','e45','teeB','teeS','gate','ball','angle','check']
def py(sy,segs):
    n,q,t=TYPE[sy['baseType']]; Q=n*q; D=n*q*t/1000
    inner,C=INNER[sy['pipeType']]; F=0.0; vo=0
    for s in segs:
        Di=inner[s['dia']]; F+=10.67*(s['flow']/60000)**1.852/(C**1.852*(Di/1000)**4.87)*(s['len']+sum(s[k]*FIT[s['dia']][i] for i,k in enumerate(FK)))
        v=(s['flow']/60000)/(math.pi*(Di/2000)**2); vo+= v>(6 if s['kind']=='br' else 10)
    J=math.ceil((sy['actualHead']+F+10)*1.1); P=0.163*(Q/1000)*J*K[sy['transType']]/(sy['pumpEff']/100); hp=P*1.341
    Php=next((h for h in HP if h>=hp), math.ceil(hp/5)*5); Pdis=J*1000*9.80665/1e6
    return dict(A=n,Clpm=Q,D=D,F=F,J=J,Pkw=P,Php=Php,Pdis=Pdis,pipePressOK=(Pdis<1.2) or sy['pipeType']=='SCH40',velOverN=vo)
random.seed(20261016); cases=[]
for _ in range(N):
    sy=dict(baseType=random.choice(list(TYPE)),actualHead=round(random.uniform(2,150),1),transType=random.randint(1,2),pumpDia=random.choice([40,50,65,80,100]),
            pumpEff=random.randint(10,80),pipeType=random.choice(list(INNER)))
    sg=[dict(kind=random.choice(['br','oth']),flow=50*random.randint(1,16),dia=random.choice(list(FIT)),len=round(random.uniform(0,80),1),**{k:random.randint(0,6) for k in FK}) for _ in range(random.randint(1,5))]
    cases.append((sy,sg))
tf=os.path.join(tempfile.gettempdir(),'_ssp_cases.json'); json.dump(cases,open(tf,'w'))
js=os.path.join(tempfile.gettempdir(),'_ssp_run.js'); keys=['A','Clpm','D','F','J','Pkw','Php','Pdis','pipePressOK','velOverN']
open(js,'w',encoding='utf-8').write("var window=globalThis;\n"+eng+"\nconst cs=require(process.argv[2]);process.stdout.write(JSON.stringify(cs.map(([s,g])=>{const c=sspCalc(s,g);return Object.fromEntries("+json.dumps(keys)+".map(k=>[k,c[k]]))})));")
E=json.loads(subprocess.check_output(['node',js,tf])); bad=[]
for i,((sy,sg),e) in enumerate(zip(cases,E)):
    p=py(sy,sg)
    for k in keys:
        if isinstance(p[k],bool) or k=='velOverN':
            if p[k]!=e[k]: bad.append((i,k,p[k],e[k])); break
        elif abs(p[k]-e[k])>1e-9*max(1,abs(p[k])): bad.append((i,k,p[k],e[k])); break
print(f'검사 {N}건 · 불일치 {len(bad)}건'); print(bad[:5])
print(f'판정 분포 — 배관 부적합 {sum(1 for e in E if not e["pipePressOK"])}건 · 유속 초과 포함 {sum(1 for e in E if e["velOverN"])}건')
