(function(){
const {SKILLS}=window.PRIMER_CONTENT, M=window.PrimerMastery, KEY="pip-primer-v1";
const $=id=>document.getElementById(id);
let seed=+(new URLSearchParams(location.search).get("seed"))||0;
const rnd=seed?()=>((seed=(seed*16807)%2147483647)/2147483647):Math.random;
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))}catch(e){return null}};
let state=load()||{name:"Friend",stars:0,voice:true,mic:false,skills:{},items:{},last:null,days:[]};
SKILLS.forEach(s=>state.skills[s.id]||(state.skills[s.id]=M.newSkill()));
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const today=new Date().toISOString().slice(0,10);if(!state.days.includes(today))state.days.push(today);
let cur=null,answered=false;

function say(t){if(!state.voice||!("speechSynthesis" in window))return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.rate=.85;u.pitch=1.1;speechSynthesis.speak(u);}
const PRAISE=["Great job! 🎉","You got it! ⭐","Super! 🌟","Wow, nice! 🥳"],COACH=["Good try! Let's look again.","Almost! You're learning.","Nice effort! Here's the answer."];

function nextItem(){
  const ch=M.chooseSkill(state,SKILLS.map(s=>s.id),rnd),sk=SKILLS.find(s=>s.id===ch.skill),lvl=state.skills[sk.id].level;
  let it=sk.gen(lvl,rnd);
  if(ch.reviewItem)for(let i=0;i<25&&it.id!==ch.reviewItem;i++)it=sk.gen(lvl,rnd);
  state.last=sk.id;cur={skill:sk,item:it,level:lvl};answered=false;render();}
function render(){
  const {skill,item,level}=cur;$("skill-tag").textContent=`${skill.icon} ${skill.name} · Level ${level}`;
  $("prompt").textContent=item.prompt;$("stage").innerHTML=item.passage?`<div class=passage>${item.passage}</div>`:(item.stage||"");
  $("choices").innerHTML="";$("feedback").textContent="";$("next").classList.add("hidden");
  if(item.type==="trace")renderTrace(item);else{
    item.choices.forEach(c=>{const b=document.createElement("button");b.className="choice";b.textContent=c;b.dataset.v=c;b.onclick=()=>answer(String(c)===String(item.answer),b);$("choices").appendChild(b);});
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(state.mic&&SR&&item.readAloud){const b=document.createElement("button");b.className="small";b.textContent="🎤 Say it out loud";b.onclick=()=>listen(SR,item);$("choices").appendChild(b);}}
  say(item.say);}
function listen(SR,item){const r=new SR();r.lang="en-US";r.maxAlternatives=5;$("feedback").textContent="Listening… 👂";
  r.onresult=e=>{const alts=[...e.results[0]].map(a=>a.transcript.toLowerCase());answer(alts.some(a=>a.split(/\W+/).includes(item.readAloud.toLowerCase())));};
  r.onerror=()=>{$("feedback").textContent="I couldn't hear that. Tap a word instead!";};r.start();}
function answer(correct,btn){
  if(answered)return;answered=true;const {skill,item}=cur;
  const res=M.record(state,skill.id,item.id,correct,item.choices?item.choices.length:0);
  if(correct)state.stars++;
  document.querySelectorAll(".choice").forEach(b=>{if(String(b.dataset.v)===String(item.answer))b.classList.add("right");else b.classList.add("wrong");});
  let msg=correct?PRAISE[Math.floor(rnd()*PRAISE.length)]:COACH[Math.floor(rnd()*COACH.length)]+(item.type==="trace"?"":` The answer is ${item.answer}.`);
  if(res.change==="up")msg+=" 🚀 Level up!";if(res.change==="down")msg+=" Let's practice an easier one.";
  $("feedback").textContent=msg;say(msg.replace(/[^\w\s.,!'?]/g,""));
  $("next").classList.remove("hidden");$("stars").textContent=state.stars;save();window.Primer.lastResult=res;}

// ---- Tracing ----
let tr=null;
function renderTrace(item){
  const S=340,c=document.createElement("canvas");c.width=c.height=S;c.id="trace";const ctx=c.getContext("2d");
  const font=`bold 260px "Trebuchet MS",Arial,sans-serif`;
  const mask=(w)=>{const m=document.createElement("canvas");m.width=m.height=S;const x=m.getContext("2d");x.font=font;x.textAlign="center";x.textBaseline="middle";x.fillText(item.answer,S/2,S/2+10);if(w){x.lineWidth=w;x.strokeText(item.answer,S/2,S/2+10);}return x.getImageData(0,0,S,S).data;};
  const inner=mask(0),outer=mask(34),ink=document.createElement("canvas");ink.width=ink.height=S;const ik=ink.getContext("2d");
  ctx.font=font;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillStyle="#ddd6ff";ctx.fillText(item.answer,S/2,S/2+10);
  [ctx,ik].forEach(k=>{k.lineWidth=22;k.lineCap=k.lineJoin="round";k.strokeStyle="#7b5cff";});
  let down=false,last=null;const pos=e=>{const r=c.getBoundingClientRect();return[(e.clientX-r.left)*S/r.width,(e.clientY-r.top)*S/r.height];};
  c.onpointerdown=e=>{down=true;last=pos(e);c.setPointerCapture&&c.setPointerCapture(e.pointerId);};
  c.onpointermove=e=>{if(!down)return;const p=pos(e);[ctx,ik].forEach(k=>{k.beginPath();k.moveTo(...last);k.lineTo(...p);k.stroke();});last=p;};
  c.onpointerup=c.onpointerleave=()=>down=false;
  const grade=()=>{const d=ik.getImageData(0,0,S,S).data;let m=0,cov=0,inkN=0,inside=0;
    for(let i=3;i<d.length;i+=16){if(inner[i]>128){m++;if(d[i]>0)cov++;}if(d[i]>0){inkN++;if(outer[i]>0)inside++;}}
    return{coverage:m?cov/m:0,precision:inkN?inside/inkN:0};};
  const done=document.createElement("button");done.className="big";done.textContent="✅ Done";
  done.onclick=()=>{const g=grade();tr.lastGrade=g;answer(g.coverage>=.45&&g.precision>=.7);};
  const clear=document.createElement("button");clear.className="small";clear.textContent="🧽 Start over";clear.onclick=()=>render();
  $("stage").appendChild(c);$("choices").append(clear,done);
  tr={canvas:c,grade,points(){const p=[];for(let y=0;y<S;y+=6)for(let x=0;x<S;x+=6)if(inner[(y*S+x)*4+3]>128)p.push([x,y]);return p;}};}

// ---- Parent dashboard ----
function dash(){
  $("name-input").value=state.name;$("voice-toggle").checked=state.voice;$("mic-toggle").checked=state.mic;
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;$("mic-toggle").disabled=!SR;
  const due=Object.values(state.items).filter(v=>v.due<=Date.now()&&v.box<3).length;
  $("dash").innerHTML=`<p class=meta>Days practiced: ${state.days.length} · Stars: ${state.stars} · Items due for review: ${due}</p>`+SKILLS.map(sk=>{const s=state.skills[sk.id],acc=s.attempts?Math.round(100*s.correct/s.attempts):0,rec=s.history.slice(-10),ra=rec.length?Math.round(100*rec.reduce((a,b)=>a+b.c,0)/rec.length):0,ov=Math.round(100*M.overall(s));
    const status=s.level===3&&s.pL>=M.MASTER?"🏆 All levels mastered":s.attempts===0?"Not started":s.pL>=.7?"Almost there":s.pL<.35&&s.attempts>3?"Needs support":"Learning";
    return`<div class=skill-row data-skill=${sk.id}><b>${sk.icon} ${sk.name}</b> — Level ${s.level}/3 · <i>${status}</i><div class=bar><div style="width:${ov}%"></div></div>
    <div class=meta>Overall progress ${ov}% · Chance current level is learned (BKT): ${Math.round(100*s.pL)}% · Tries: ${s.attempts} · Accuracy: ${acc}% (last 10: ${ra}%) · Levels mastered at some point: ${s.mastered.join(", ")||"none yet"}</div></div>`;}).join("");}
$("name-input").oninput=e=>{state.name=e.target.value||"Friend";$("kid-name").textContent=state.name;save();};
$("voice-toggle").onchange=e=>{state.voice=e.target.checked;save();};$("mic-toggle").onchange=e=>{state.mic=e.target.checked;save();};
$("reset").onclick=()=>{if(confirm("Erase all progress in this browser?")){localStorage.removeItem(KEY);location.reload();}};
$("export").onclick=()=>{const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:"application/json"}));a.download="pip-primer-progress.json";a.click();};
const tab=t=>{$("learn").classList.toggle("hidden",t!=="learn");$("parent").classList.toggle("hidden",t!=="parent");$("nav-learn").classList.toggle("active",t==="learn");$("nav-parent").classList.toggle("active",t==="parent");if(t==="parent")dash();};
$("nav-learn").onclick=()=>tab("learn");$("nav-parent").onclick=()=>tab("parent");
$("next").onclick=nextItem;$("speak").onclick=()=>{const v=state.voice;state.voice=true;say(cur.item.say);state.voice=v;};
$("kid-name").textContent=state.name;$("stars").textContent=state.stars;$("streak").textContent=`📅 ${state.days.length} day${state.days.length>1?"s":""}`;
// Small hook for automated tests & curious parents
window.Primer={get state(){return state},get current(){return cur},get trace(){return tr},answer,next:nextItem,tab,
  force(skillId){const sk=SKILLS.find(s=>s.id===skillId);cur={skill:sk,item:sk.gen(state.skills[skillId].level,rnd),level:state.skills[skillId].level};state.last=skillId;answered=false;render();}};
nextItem();
})();
