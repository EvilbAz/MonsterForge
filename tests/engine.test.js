import test from 'node:test';
import assert from 'node:assert/strict';
import {DATA} from '../dist/data.js';
import {generate,defaults,blankBattle,replay,availability,declaration,damageExpression,addEvent,validateImport,multithrow} from '../dist/engine.js';
const p=generate(defaults);
const event=(b,type,ic,extra={})=>addEvent(b,{type,ic,...extra});
test('default profile matches the workbook cached numeric and loadout outputs',()=>{
 assert.equal(p.name,'Gravebone Ape');assert.deepEqual(p.stats,{STR:115,RES:130,CHA:75,DEX:75,AGI:65});
 assert.equal(p.budget,2255);assert.equal(p.gate,376);assert.equal(p.breakThreshold,188);assert.equal(p.pdb,6.4);assert.equal(p.ndb,4.2);assert.equal(p.accuracy,21);assert.equal(p.defense,11);assert.equal(p.movement,1.3);assert.equal(p.grappleOff,21.5);assert.equal(p.grappleDef,14.75);
 assert.deepEqual(p.actions.map(a=>a.name),['Goring Thrust','Earthshaking Slam','Debris Volley','Territorial Display','Bulwark Ram','Bone Spines','Fireball Technique']);
});
test('all tribe / threat combinations generate deterministic compatible complete profiles',()=>{
 for(const t of DATA.tribes)for(const threat of DATA.threats)for(const seed of [1,2,7,421,999999]){
  const c={...defaults,tribe:t[0],threat:threat[0],seed};const a=generate(c);assert.deepEqual(a,generate(c));assert.ok(t.slice(1,6).includes(a.body));assert.ok(t.slice(7,10).includes(a.role));assert.ok(t.slice(10,14).includes(a.mutation));assert.ok(a.actions.length>=6&&a.actions.length<=8);assert.ok(a.gate>0);assert.ok(a.actions.every(a=>a.part>=0&&a.part<4));
 }
 assert.equal(DATA.actions.length,120);assert.equal(DATA.bodies.length,24);
});
test('party scales durability only; ordinary enemy dice scale; printed jutsu remain fixed',()=>{
 const small=generate({...defaults,hunters:2});assert.equal(small.dice,p.dice);assert.equal(small.pdb,p.pdb);assert.ok(small.budget<p.budget);const multiple=generate({...defaults,enemies:4});assert.ok(multiple.dice<p.dice);assert.equal(damageExpression(multiple.actions[6],multiple),damageExpression(p.actions[6],p));
});
test('damage carries through multiple gates but opens only one wound with zero initial progress',()=>{
 const b=blankBattle();event(b,'Damage',0,{part:0,amount:p.gate*2+17,targeted:false});const l=replay(p,b);assert.equal(l.gates,2);assert.equal(l.nextGate,p.gate-17);assert.equal(l.parts[0].window,'Open');assert.equal(l.parts[0].progress,0);assert.equal(l.parts.filter(a=>a.opened!==null).length,1);
});
test('weakspot applies once, wounding affects break only, windows include exact expiry',()=>{
 const b=blankBattle();event(b,'Damage',0,{part:0,amount:p.gate});event(b,'Damage',20,{part:0,amount:100,targeted:true,wounding:50});b.ic=20;let l=replay(p,b);assert.equal(l.damage,p.gate+125);assert.equal(l.parts[0].progress,187.5);assert.equal(l.parts[0].opened,0);assert.equal(l.parts[0].window,'Open');event(b,'Damage',20,{part:0,amount:10,targeted:true,includesWeakspot:true});l=replay(p,b);assert.equal(l.damage,p.gate+135);assert.equal(l.parts[0].progress,197.5);assert.equal(l.parts[0].window,'Break ready');b.ic=21;assert.equal(replay(p,b).parts[0].window,'Expired');event(b,'Break',21,{part:0});assert.equal(replay(p,b).parts[0].broken,false);
});
test('earned part breaks persist and disable their linked actions',()=>{
 const b=blankBattle();event(b,'Damage',0,{part:0,amount:p.gate});event(b,'Damage',1,{part:0,amount:p.breakThreshold,targeted:true});event(b,'Break',1,{part:0});b.ic=100;const l=replay(p,b);assert.equal(l.parts[0].window,'Broken');assert.equal(l.accuracy,p.accuracy-1);assert.equal(availability(p.actions[0],p,b,l),'Part broken');
});
test('expired wounds reopen with zero progress and wounding-only can meet opening threshold',()=>{
 const b=blankBattle();event(b,'Damage',0,{part:0,amount:p.breakThreshold/2,targeted:true,wounding:100});assert.equal(replay(p,b).parts[0].window,'Open');event(b,'Damage',21,{part:0,amount:p.breakThreshold,targeted:true});b.ic=21;const l=replay(p,b);assert.equal(l.parts[0].opened,21);assert.equal(l.parts[0].progress,0);
});
test('wounded Heavy cost, recovery floors, collapse expiry and no repeated collapse extension',()=>{
 const b=blankBattle();event(b,'Damage',0,{part:0,amount:p.gate*2});event(b,'Action',1,{slot:2});b.ic=1;assert.equal(replay(p,b).exertion,3);event(b,'Damage',2,{part:0,amount:p.gate*2});event(b,'Recover',3,{amount:-3});b.ic=3;assert.equal(replay(p,b).exertion,4);event(b,'Exertion',4,{amount:6});event(b,'Exertion',5,{amount:2});b.ic=5;assert.equal(replay(p,b).spentUntil,14);b.ic=14;assert.equal(replay(p,b).exertion,7);assert.equal(replay(p,b).spentUntil,0);event(b,'Recover',14,{amount:-3});assert.equal(replay(p,b).exertion,4);
});
test('Doton absent-earth is converted before heavy classification and Wounded modifier',()=>{
 const q=generate({...defaults,element:'Doton',casting:'Instinctive'}),b=blankBattle();event(b,'Damage',0,{part:0,amount:q.gate*2});event(b,'Action',1,{slot:7,noEarth:true});b.ic=1;assert.equal(replay(q,b).exertion,3);assert.match(declaration(q.actions[6],q,b,replay(q,b),{noEarth:true}),/Exertion: 3/);event(b,'Exertion',2,{amount:5});b.ic=2;assert.equal(availability(q.actions[6],q,b,replay(q,b),true),'Too exhausted');
});
test('capture needs continuously held prerequisites, time and manual confirmation',()=>{
 const b=blankBattle();event(b,'Damage',0,{part:0,amount:p.gate*5});event(b,'Exertion',0,{amount:2});event(b,'Restraint',0,{value:true});event(b,'Gear',0,{value:true});event(b,'CaptureStart',0);b.ic=9;let l=replay(p,b);assert.equal(l.captureReady,true);assert.equal(l.capture.confirmed,false);event(b,'CaptureConfirm',9);assert.equal(replay(p,b).capture.confirmed,false);b.ic=10;event(b,'CaptureConfirm',10);assert.equal(replay(p,b).capture.confirmed,true);
 const b2=structuredClone(b);event(b2,'Restraint',5,{value:false});event(b2,'Restraint',6,{value:true});assert.equal(replay(p,b2).capture.invalid,true);
});
test('spent recovery invalidates capture even without another event; Felled is never capture ready',()=>{
 const b=blankBattle();event(b,'Damage',0,{part:0,amount:p.gate*5});event(b,'Exertion',0,{amount:4});event(b,'Restraint',0,{value:true});event(b,'Gear',0,{value:true});event(b,'CaptureStart',5);b.ic=11;const l=replay(p,b);assert.equal(l.exertion,7);assert.equal(l.capture.invalid,true);event(b,'Damage',12,{part:0,amount:p.gate});b.ic=12;assert.equal(replay(p,b).captureReady,false);
});
test('future events remain pending, cooldowns use resolution, and replay can rewind',()=>{
 const b=blankBattle();event(b,'Action',5,{slot:2});assert.equal(replay(p,b).exertion,0);assert.equal(availability(p.actions[1],p,b,replay(p,b)),'Pending resolution');b.ic=5;assert.equal(replay(p,b).exertion,2);assert.equal(availability(p.actions[1],p,b,replay(p,b)),'Cooldown until IC 30');b.ic=30;assert.equal(availability(p.actions[1],p,b,replay(p,b)),'Ready');b.ic=0;assert.equal(replay(p,b).exertion,0);
});
test('jutsu damage uses Attack Speed only and preserves special notation',()=>{
 const a=p.actions[6],b=blankBattle(),text=declaration(a,p,b,replay(p,b));assert.match(text,/Channel: 5/);assert.match(text,/resolves IC 5; next action IC 11/);assert.equal(damageExpression(a,p),'[[(10d4!o>4)+(4.2*6)]]');assert.match(declaration(a,p,b,replay(p,b),{format:'macro'}),/\$speed 6/);
});
test('invalid imports / inputs are rejected before corrupting state',()=>{
 const s={version:1,config:{...defaults},battle:blankBattle()};assert.equal(validateImport(s),s);assert.throws(()=>validateImport({...s,version:99}));assert.throws(()=>generate({...defaults,enemies:0}));assert.throws(()=>validateImport({...s,battle:{...blankBattle(),events:[{id:1,ic:0,type:'Damage',part:4,amount:10}]}}));assert.throws(()=>addEvent(blankBattle(),{type:'Recover',ic:0,amount:1}));
});
test('multithrow templates respect count limits, minimum speed and explicit senbon permission',()=>{
 const text=multithrow(p,{weapon:'Kunai',count:6});assert.match(text,/Stamina: 8, Speed 6/);assert.match(text,/12d6\+\(9.4\*6\)/);assert.match(multithrow(p,{weapon:'Shuriken',count:2}),/ACC 23/);assert.throws(()=>multithrow(p,{count:8}));assert.throws(()=>multithrow(p,{weapon:'Senbon',count:2}));assert.match(multithrow(p,{weapon:'Senbon',count:2,senbonPermission:true}),/2d4/);
});
