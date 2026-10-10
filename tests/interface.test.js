import test from 'node:test';
import assert from 'node:assert/strict';
const listeners={},windowListeners={},nodes=new Map(),storage=new Map();let copied='';
function classes(){const s=new Set();return {toggle(k,v){if(v===undefined)v=!s.has(k);v?s.add(k):s.delete(k);return v;},contains:k=>s.has(k),add:k=>s.add(k),remove:k=>s.delete(k)};}
function node(){return {innerHTML:'',textContent:'',value:'',checked:false,dataset:{},classList:classes(),setAttribute(){},removeAttribute(){},focus(){},select(){},querySelectorAll(){return [];},showModal(){},close(){}};}
const nav=['forge','combat','parts','hunt','library','rules'].map(view=>({...node(),dataset:{view}}));
globalThis.document={body:{classList:classes(),append(){}},documentElement:{dataset:{}},querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);},querySelectorAll(){return nav;},addEventListener(k,f){(listeners[k]??=[]).push(f);},title:''};
globalThis.window={addEventListener(k,f){(windowListeners[k]??=[]).push(f);},print(){}};
globalThis.location={hash:'#forge',origin:'https://example.org',pathname:'/MonsterForge/',search:''};globalThis.history={replaceState(a,b,url){location.hash=url.slice(url.indexOf('#'));}};
globalThis.localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
Object.defineProperty(globalThis,'navigator',{value:{clipboard:{writeText:async s=>{copied=s;}}},configurable:true});
await import('../dist/app.js');
const dispatch=async(type,event)=>{for(const fn of listeners[type]||[])await fn(event);};
const click=async(data)=>dispatch('click',{target:{closest(){return {dataset:data};}}});
const goto=async(view)=>{location.hash='#'+view;for(const fn of windowListeners.hashchange||[])await fn();};
test('all six views render from the same live profile without runtime errors',async()=>{
 for(const [view,text] of [['forge','Gravebone Ape'],['combat','The field clock'],['parts','Clinging hunters'],['hunt','Player announcement'],['library','Your bestiary is empty'],['rules','Injury Gates']]){await goto(view);assert.ok(nodes.get('#view').innerHTML.includes(text),view);}
});
test('declaration copy, damage logging and advancing IC integrate with live replay',async()=>{
 await goto('combat');await click({do:'copy-action',slot:'7'});assert.match(copied,/Fireball Technique/);assert.match(copied,/next action IC 11/);
 nodes.get('#damage')??nodes.set('#damage',node());nodes.get('#damage').value='376';document.querySelector('#hit-part').value='Head';document.querySelector('#wounding').value='0';
 await dispatch('submit',{target:{id:'damage-form',matches:()=>true},preventDefault(){}});assert.match(nodes.get('#view').innerHTML,/Bloodied/);assert.match(nodes.get('#view').innerHTML,/1 entries/);
 await click({do:'advance',amount:'5'});assert.match(nodes.get('#view').innerHTML,/5<small> CURRENT IC/);
 await click({do:'declare',slot:'2'});assert.match(copied,/Earthshaking Slam/);assert.match(nodes.get('#view').innerHTML,/Pending/);
});
test('bestiary opening preserves the selected snapshot when current hunt is archived',async()=>{
 await click({do:'save-monster'});await click({do:'advance',amount:'5'});await goto('library');await click({do:'load-monster',index:'0'});assert.equal(JSON.parse(storage.get('ember-monsterforge-v1')).battle.ic,5);assert.equal(JSON.parse(storage.get('ember-monsterforge-bestiary-v1')).length,2);
});
test('share link round-trip preserves Unicode and encounter state',async()=>{
 await click({do:'share'});assert.ok(copied.startsWith('https://example.org/MonsterForge/#import='));location.hash=copied.slice(copied.indexOf('#'));for(const fn of windowListeners.hashchange)await fn();assert.equal(location.hash,'#combat');assert.match(nodes.get('#view').innerHTML,/Bloodied/);
});
