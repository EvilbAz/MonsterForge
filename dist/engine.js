import {DATA} from './data.js';
export const injuryNames=['Healthy','Bloodied','Wounded','Injured','Badly Injured','Critical','Felled'];
export const energyNames=['Energetic','Worked','Winded','Tired','Exhausted','Spent'];
export const defaults={seed:421,tribe:'Colossus',body:'Auto',threat:'Great Beast',role:'Auto',xp:1500,hunters:4,enemies:1,intensity:'Standard',casting:'Auto',name:'',element:'Auto',variation:0,mutation:'Auto'};
const round=(n,p=0)=>Math.round((n+Number.EPSILON)*10**p)/10**p;
const num=(v)=>Number(v)||0;
const choose=(v,auto)=>v==='Auto'?auto:v;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export function validateConfig(c){
 for(const [k,min,max] of [['seed',1,999999],['variation',0,999999],['xp',0,100000],['hunters',1,100],['enemies',1,100]]) if(!Number.isInteger(c[k])||c[k]<min||c[k]>max)throw Error(`${k} must be a whole number from ${min} to ${max}.`);
 for(const [k,values] of [['tribe',DATA.tribes.map(r=>r[0])],['threat',DATA.threats.map(r=>r[0])],['body',['Auto',...DATA.bodies.map(r=>r[0])]],['role',['Auto',...DATA.roles.map(r=>r[0])]],['mutation',['Auto',...DATA.mutations.map(r=>r[0])]],['element',['Auto','Katon','Raiton','Suiton','Doton','Fuuton']],['casting',['Auto','Never','Instinctive','Adept']],['intensity',['Conservative','Standard','High']]])if(!values.includes(c[k]))throw Error(`Unknown ${k}.`);
 if(typeof c.name!=='string'||c.name.length>160)throw Error('Name must be 160 characters or fewer.');return c;
}
export function generate(c){
 validateConfig(c);
 const ti=DATA.tribes.findIndex(r=>r[0]===c.tribe),t=DATA.tribes[ti],ix=ti+1,s=c.seed,step=Math.max(0,round((c.xp-1000)/500));
 const body=choose(c.body,t[1+(s*13+ix*7)%num(t[6])]);
 const role=choose(c.role,t[7+(s*17+ix)%3]);
 const mutation=choose(c.mutation,t[10+(s*23+ix)%4]);
 const m=DATA.mutations.find(r=>r[0]===mutation),r=DATA.roles.find(r=>r[0]===role),th=DATA.threats.find(r=>r[0]===c.threat),b=DATA.bodies.find(r=>r[0]===body);
 const mi=DATA.mutations.indexOf(m)+1,element=choose(c.element,m[2]==='None'?t[14+(s+ix)%2]:m[2]);
 const slots=c.casting==='Never'?0:c.casting==='Instinctive'?1:c.casting==='Adept'?2:[2,1,0,0][(s*31+ix)%4];
 const stats=Object.fromEntries(['STR','RES','CHA','DEX','AGI'].map((k,i)=>[k,Math.max(10,round(num(th[i+2])+15*step+num(r[i+2])+num(m[i+8])))]));
 const budget=round((num(th[7])+num(th[8])*step+num(th[9])+num(th[10])*step)*Math.max(.25,(c.hunters/4)/c.enemies)*num(r[7])*num(m[13])*(c.intensity==='High'?1.1:c.intensity==='Conservative'?.9:1));
 const dice=Math.max(2,round((num(th[20])+round(step*.75)+(c.intensity==='High'?1:c.intensity==='Conservative'?-1:0))/Math.sqrt(c.enemies)));
 const seed=s+c.variation,keys=[15427,21313,31237,47237].map((coef,i)=>`${c.tribe}-${i+1}-${Math.floor((seed*coef+ix*[71,131,193,257][i])%104729/7)%3+1}`);
 keys.push(`${role}-R-${(seed*61+ix)%2+1}`,`M-${mi}`);
 const ei=['Katon','Raiton','Suiton','Doton','Fuuton'].indexOf(element);for(let i=0;i<slots;i++)keys.push(`J-${ei*2+i+1}`);
 const p={config:{...c},name:c.name||`${m[1]} ${body}`,body,role,mutation,element,slots,step,stats,budget,gate:Math.ceil(budget/6),breakThreshold:Math.ceil(Math.ceil(budget/6)/2),pdb:round(stats.STR/18,1),ndb:round(stats.CHA/18,1),accuracy:round(num(th[11])+2*step+num(r[8])+num(m[14])),defense:round(num(th[12])+2*step+num(r[9])+num(m[15])),initiative:round(stats.AGI/10,1),movement:round(stats.AGI/50,1),dr:num(m[16])?num(m[16])+5*step:0,grappleOff:10+stats.STR/10+(role==='Grappler'?3:0),grappleDef:stats.STR/10+stats.AGI/20+(role==='Grappler'?3:0),save:10+num(th[19])+2*step,dice,die:num(th[21]),skills:{Awareness:num(th[15])+2*step,Resistance:num(th[16])+2*step,Survival:num(th[17])+2*step,Athletics:num(th[18])+2*step,'Chakra Control':num(th[19])+2*step},climbable:c.tribe!=='Colony'&&num(th[1])>=3,trait:m[5],counter:m[6],salvage:`${b[2]}; ${m[7]}`,appearance:b[1],terrain:b[3],identity:t[16],tracks:t[17],tribeCounter:t[18],behavior:t[19],tactics:r[10],mutationBudget:`${m[3]} / ${th[14]}`,parts:DATA.anatomy[ti].slice(1,5),warnings:[]};
 if(!t.slice(1,6).includes(body))p.warnings.push('Body outside tribe.');if(!t.slice(7,10).includes(role))p.warnings.push('Role outside tribe.');if(!t.slice(10,14).includes(mutation))p.warnings.push('Mutation outside tribe.');if(!t.slice(14,16).includes(element))p.warnings.push('Element outside tribe.');
 if(c.xp<1000||c.xp>2500)p.warnings.push('XP outside inherited 1,000–2,500 calibration range.');if(num(th[1])>=5)p.warnings.push('Objective-tier monster: prepare a mission win condition beyond killing it.');if(c.enemies>1&&slots)p.warnings.push('Printed jutsu do not scale down with enemy count. Review combined damage.');
 p.actions=keys.map((key,i)=>{const a=DATA.actions.find(a=>a[0]===key);if(!a)throw Error(`Missing action ${key}`);return {slot:i+1,key,name:a[1],speed:num(a[2]),delay:num(a[3]),effort:num(a[4]),cooldown:num(a[5]),reach:a[6],type:a[7],scale:a[8],offset:num(a[9]),acc:num(a[10]),effect:a[11],tell:a[12],counter:a[13],part:num(a[14])-1,source:a[15],printed:a[16],chakra:num(a[17]),jutsu:key.startsWith('J-')};});return p;
}
export const blankBattle=()=>({ic:0,next:0,events:[],climbers:[],statuses:[],restraint:false,gear:false});
export function replay(p,b,time=b.ic){
 let damage=0,gates=0,exertion=0,spentUntil=0,capture=null,restraint=false,gear=false;const lastUsed={};const parts=p.parts.map(name=>({name,opened:null,progress:0,broken:false}));
 const qualified=()=>gates===5&&exertion>=8&&restraint&&gear;
 const checkCapture=(ic)=>{if(capture&&!capture.invalid&&ic<=capture.ends&&!qualified())capture.invalid=true;};
 const expire=(ic)=>{if(spentUntil&&ic>=spentUntil){const expiry=spentUntil;exertion=Math.max(7,gates>=5?6:gates>=4?4:0);spentUntil=0;checkCapture(expiry);}};
 for(const e of [...b.events].sort((a,b)=>a.ic-b.ic||a.id-b.id)){
  if(e.ic>time)continue;expire(e.ic);const prev=gates;
  if(e.type==='Damage'){
   const part=parts[e.part],open=part&&!part.broken&&part.opened!==null&&e.ic>=part.opened&&e.ic<=part.opened+20;
   const final=e.amount*(open&&e.targeted&&!e.includesWeakspot?1.25:1);damage+=final;gates=Math.min(6,Math.floor(damage/p.gate));
   const progress=final*(1+(e.wounding||0)/100);
   if(part&&!part.broken){if(open&&e.targeted)part.progress+=progress;else if(!open&&(gates>prev||(e.targeted&&progress>=p.breakThreshold))){part.opened=e.ic;part.progress=0;}}
  }else if(e.type==='Break'){
   const part=parts[e.part];if(part&&part.opened!==null&&e.ic>=part.opened&&e.ic<=part.opened+20&&part.progress>=p.breakThreshold&&!part.broken){part.broken=true;part.opened=null;}
  }else if(e.type==='Action'){
   const a=p.actions.find(a=>a.slot===e.slot);if(a){lastUsed[a.slot]=e.ic;const base=baseEffort(a,p,e.noEarth);if(!spentUntil)exertion+=base+(prev>=2&&base>=2?1:0);}
  }else if(['Exertion','Recover'].includes(e.type)&&!spentUntil)exertion+=e.amount;
  else if(e.type==='Restraint')restraint=e.value;
  else if(e.type==='Gear')gear=e.value;
  else if(e.type==='CaptureStart')capture={start:e.ic,ends:e.ic+10,invalid:!qualified(),confirmed:false};
  else if(e.type==='CaptureInterrupt'&&capture)capture.invalid=true;
  else if(e.type==='CaptureConfirm'&&capture&&e.ic>=capture.ends&&!capture.invalid&&qualified())capture.confirmed=true;
  exertion=clamp(exertion,gates>=5?6:gates>=4?4:0,10);if(exertion===10&&!spentUntil)spentUntil=e.ic+10;
  checkCapture(e.ic);
 }
 expire(time);
 for(const part of parts)part.window=part.broken?'Broken':part.opened===null?'Closed':time>part.opened+20?'Expired':part.progress>=p.breakThreshold?'Break ready':'Open';
 const penalty=exertion>=8?3:exertion>=6?2:exertion>=4?1:0;
 return {damage,gates,exertion,spentUntil,parts,lastUsed,capture,restraint,gear,captureReady:qualified(),injury:injuryNames[gates],energy:energyNames[Math.floor(exertion/2)],penalty,accuracy:p.accuracy-penalty-(parts[0].broken?1:0),defense:p.defense-penalty,dr:parts[2].broken?0:p.dr,grappleOff:p.grappleOff-penalty,grappleDef:p.grappleDef-penalty,movement:round(p.movement*(1-Math.min(.6,(gates>=3?.2:0)+(exertion>=8?.4:exertion>=6?.2:0)+(parts[1].broken&&p.config.tribe!=='Sky'?.2:0))),2),nextGate:gates===6?0:round(p.gate-damage%p.gate,2),floor:gates>=5?6:gates>=4?4:0};
}
export function baseEffort(a,p,noEarth=false){return a.jutsu&&p.element==='Doton'&&noEarth?Math.max(1,Math.ceil((a.chakra+5)/8)):a.effort;}
export function availability(a,p,b,live,noEarth=false){
 if(live.gates>=6)return 'Felled';if(live.exertion===10)return 'Spent';if(live.parts[a.part]?.broken)return 'Part broken';if(live.exertion>=8&&baseEffort(a,p,noEarth)>=2)return 'Too exhausted';
 const ready=(live.lastUsed[a.slot]??-Infinity)+a.cooldown;if(b.ic<ready)return `Cooldown until IC ${ready}`;if(b.events.some(e=>e.type==='Action'&&e.slot===a.slot&&e.ic>b.ic))return 'Pending resolution';return 'Ready';
}
export function damageExpression(a,p){return a.scale==='U'?'No damage':`[[(${a.jutsu?a.printed:Math.max(1,p.dice+a.offset)+'d'+p.die})+(${a.scale==='N'?p.ndb:p.pdb}*${a.speed})]]`;}
export function declaration(a,p,b,live,{target='',format='plain',noEarth=false}={}){
 const base=baseEffort(a,p,noEarth),effort=base+(live.gates>=2&&base>=2?1:0);
 const header=`(**${a.name}**: (${a.type}${a.jutsu?' '+p.element+' Ninjutsu':' Monster Action'}), Exertion: ${effort}, ${format==='macro'?'$speed':'Spd:'} ${a.speed}, ${a.jutsu?'Channel':'Delay'}: ${a.delay}, Range / Area: ${a.reach}, AP 0, ACC ${live.accuracy+a.acc})`;
 return `${header}${target?'\nTarget: '+target:''}\n${damageExpression(a,p)}\n${a.effect}\nDeclare IC ${b.ic}; resolves IC ${b.ic+a.delay}; next action IC ${b.ic+a.speed+(a.jutsu?a.delay:0)}. Max interrupt Speed ${Math.floor(a.speed/2)}.`;
}
export function addEvent(b,e){if(!Number.isFinite(e.ic)||e.ic<0)throw Error('IC must be a non-negative number.');if(e.amount!==undefined&&!Number.isFinite(e.amount))throw Error('Enter a valid amount.');if(e.type==='Damage'&&e.amount<0)throw Error('Damage cannot be negative.');if(e.type==='Recover'&&e.amount>=0)throw Error('Recovery must be negative.');const id=Math.max(0,...b.events.map(e=>e.id))+1;b.events.push({...e,id});return id;}
export function validateImport(o){
 if(!o||o.version!==1)throw Error('Unsupported sheet format. Use a MonsterForge v1 export.');validateConfig(o.config);const b=o.battle;if(!b||!Array.isArray(b.events)||!Array.isArray(b.climbers)||!Array.isArray(b.statuses)||!Number.isFinite(b.ic)||b.ic<0||!Number.isFinite(b.next)||b.next<0||b.events.length>10000)throw Error('Invalid battle data.');
 o.hunt={location:'',incident:'',objective:'Capture',tracks:0,nature:0,weakness:0,preparations:'',...o.hunt};for(const k of ['location','incident','objective','preparations'])if(typeof o.hunt[k]!=='string')throw Error('Invalid hunt details.');for(const k of ['tracks','nature','weakness'])if(!Number.isFinite(Number(o.hunt[k]))||Number(o.hunt[k])<0)throw Error('Invalid research intel.');if(o.notes===undefined)o.notes='';if(typeof o.notes!=='string')throw Error('Invalid GM notes.');
 const types=['Damage','Break','Action','Exertion','Recover','Restraint','Gear','CaptureStart','CaptureInterrupt','CaptureConfirm'];const ids=new Set();for(const e of b.events){if(!types.includes(e.type)||!Number.isFinite(e.ic)||e.ic<0||!Number.isInteger(e.id)||ids.has(e.id))throw Error('Invalid battle event.');ids.add(e.id);if(['Damage','Exertion','Recover'].includes(e.type)&&(!Number.isFinite(e.amount)||(e.type==='Damage'&&e.amount<0)||(e.type==='Recover'&&e.amount>=0)))throw Error('Invalid event amount.');if(['Damage','Break'].includes(e.type)&&(!Number.isInteger(e.part)||e.part<0||e.part>3))throw Error('Invalid body part.');if(e.type==='Action'&&(!Number.isInteger(e.slot)||e.slot<1||e.slot>8))throw Error('Invalid action slot.');if(e.wounding!==undefined&&(!Number.isFinite(e.wounding)||e.wounding<0||e.wounding>1000))throw Error('Invalid wounding bonus.');}
 for(const c of b.climbers)if(typeof c.name!=='string'||!Number.isInteger(c.part)||c.part<0||c.part>3||!Number.isFinite(c.control)||!Number.isFinite(c.max)||c.max<1||!Number.isFinite(c.next))throw Error('Invalid climber.');for(const s of b.statuses)if(typeof s.name!=='string'||!Number.isFinite(s.start)||!Number.isFinite(s.duration)||s.duration<0)throw Error('Invalid status.');return o;
}
export function multithrow(p,{weapon='Kunai',count=2,perWeapon=.5,senbonUser=false,senbonPermission=false,format='plain'}={}){
 const max=Math.floor(p.stats.DEX/10);if(!Number.isInteger(count)||count<2||count>max)throw Error(`Throw between 2 and ${max} projectiles.`);if(!['Kunai','Shuriken','Senbon'].includes(weapon))throw Error('Choose a small ranged weapon.');if(weapon==='Senbon'&&!senbonPermission)throw Error('Senbon Multi-Throw permission is required.');if(![.25,.5].includes(perWeapon))throw Error('Choose a listed DB increment.');
 const speed=Math.max(5,3+Math.ceil(count/2)),stamina=5+Math.floor(count/2),db=(weapon==='Senbon'&&senbonUser?Math.max(p.pdb,Math.floor(p.stats.DEX/15*10)/10):p.pdb)+(weapon==='Senbon'?0:perWeapon*count),acc=p.accuracy+(weapon==='Shuriken'?2:weapon==='Senbon'&&!senbonUser?-2:0);
 return `**${weapon} - Multi-Throw** (Basic Attack) Stamina: ${stamina}, ${format==='macro'?'$speed':'Speed'} ${speed}, AP 0, ACC ${acc}\n[[${count*(weapon==='Kunai'?2:1)}d${weapon==='Senbon'?4:6}+(${db}*${speed})]]\n${count} projectiles; limit ${max}. Wound severity reduced one category (minimum Minor).\nCarried-weapon reference only: wild-monster Exertion conversion and wound-gate interaction require an explicit GM ruling.`;
}
