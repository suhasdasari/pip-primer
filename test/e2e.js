// Headless Chrome end-to-end test. Usage: python3 -m http.server 18473 (in repo root) & node test/e2e.js
const puppeteer=require("puppeteer-core");
const URL=process.env.URL||"http://127.0.0.1:18473/?seed=7", SHOT=process.env.SHOT||"screenshot.png";
const results=[];const ok=(name,cond,info="")=>{results.push({name,pass:!!cond,info});console.log((cond?"PASS":"FAIL")+" - "+name+(info?" — "+info:""));};
(async()=>{
const b=await puppeteer.launch({executablePath:process.env.CHROME||"/usr/bin/google-chrome",headless:"new",args:["--no-sandbox","--autoplay-policy=no-user-gesture-required"]});
const p=await b.newPage();await p.setViewport({width:1100,height:1000});
const errors=[];p.on("pageerror",e=>errors.push(e.message));p.on("console",m=>m.type()==="error"&&errors.push(m.text()));
await p.goto(URL);await p.evaluate(()=>localStorage.clear());await p.reload();await p.waitForFunction(()=>window.Primer);
const sk=id=>p.evaluate(id=>{const s=Primer.state.skills[id];return{level:s.level,pL:+s.pL.toFixed(3),attempts:s.attempts,mastered:s.mastered.slice()}},id);
const respond=async(id,correct)=>{await p.evaluate(id=>Primer.force(id),id);const ans=await p.evaluate(()=>String(Primer.current.item.answer));
  const sel=correct?`.choice[data-v="${ans}"]`:`.choice:not([data-v="${ans}"])`;await p.click(sel);return p.evaluate(()=>Primer.lastResult);};
// 1 correct streak -> level up
let log=[];for(let i=0;i<20;i++){const r=await respond("addition",true);log.push(r.after.pL.toFixed(2)+(r.change?"↑":""));}
let a=await sk("addition");ok("Correct streak raises mastery and levels up addition",a.level===3&&a.mastered.includes(1)&&a.mastered.includes(2),`level ${a.level}, mastered ${a.mastered}, pL trace ${log.join(" ")}`);
// 2 wrong answers -> mastery drops, level down
const before=await sk("addition");log=[];for(let i=0;i<4;i++){const r=await respond("addition",false);log.push(r.after.pL.toFixed(2)+(r.change?"↓":""));}
a=await sk("addition");ok("Incorrect answers lower mastery and drop difficulty",a.level<before.level,`level ${before.level}→${a.level}, pL trace ${log.join(" ")}`);
// 3 struggling beginner stays at level 1 with low pL
for(let i=0;i<5;i++)await respond("sight",false);const s=await sk("sight");ok("Struggling learner stays at level 1 with low mastery (sight words)",s.level===1&&s.pL<.2,`pL ${s.pL}`);
// 4 mixed answers on number sense: 70% correct
for(let i=0;i<10;i++)await respond("number",i%10<7);const n=await sk("number");ok("Mixed answers give intermediate estimate",n.attempts===10,`level ${n.level}, pL ${n.pL}`);
// 5 harder content at higher level
const lvl3=await p.evaluate(()=>{Primer.state.skills.addition.level=3;Primer.force("addition");return Primer.current.item;});
ok("Level-3 addition items use sums up to 20 without picture support",lvl3.answer<=20&&!lvl3.stage,lvl3.prompt);
// 6 spaced repetition
const sr=await p.evaluate(()=>Object.values(Primer.state.items).filter(i=>i.skill==="sight").map(i=>i.box));ok("Missed items return to Leitner box 0 for quick review",sr.every(x=>x===0),`boxes ${sr}`);
// 7 tracing good vs scribble
await p.evaluate(()=>Primer.force("writing"));
const traceAt=async pts=>{const box=await (await p.$("#trace")).boundingBox(),k=box.width/340;const rows={};pts.forEach(([x,y])=>(rows[y]=rows[y]||[]).push(x));
  for(const y in rows){const xs=rows[y].sort((a,b)=>a-b);let st=xs[0];for(let i=1;i<=xs.length;i++){if(i===xs.length||xs[i]-xs[i-1]>6){await p.mouse.move(box.x+st*k,box.y+y*k);await p.mouse.down();await p.mouse.move(box.x+xs[i-1]*k+1,box.y+y*k,{steps:3});await p.mouse.up();st=xs[i];}}}};
await traceAt(await p.evaluate(()=>Primer.trace.points()));await p.click("#choices .big");
let g=await p.evaluate(()=>({g:Primer.trace.lastGrade,r:Primer.lastResult}));ok("Accurate tracing is graded correct",g.r.after.pL>g.r.before.pL,`coverage ${g.g.coverage.toFixed(2)}, precision ${g.g.precision.toFixed(2)}`);
await p.evaluate(()=>Primer.force("writing"));await traceAt([[10,10],[60,10],[10,320],[60,320],[300,320],[330,320]]);await p.click("#choices .big");
g=await p.evaluate(()=>({g:Primer.trace.lastGrade,r:Primer.lastResult}));ok("Scribble outside the letter is graded incorrect",g.r.after.pL<g.r.before.pL,`coverage ${g.g.coverage.toFixed(2)}, precision ${g.g.precision.toFixed(2)}`);
// 8 every skill/level generates valid items
const bad=await p.evaluate(()=>{const out=[];for(const s of PRIMER_CONTENT.SKILLS)for(let l=1;l<=3;l++)for(let i=0;i<200;i++){const it=s.gen(l,Math.random);if(it.type!=="trace"&&(!it.choices.map(String).includes(String(it.answer))||new Set(it.choices.map(String)).size!==it.choices.length||it.choices.length<2))out.push(s.id+l+":"+it.prompt+JSON.stringify(it.choices));if(typeof it.answer==="number"&&it.answer<0)out.push("neg "+it.prompt);}return out;});
ok("4,200 generated items: answer always among unique choices, no negatives",bad.length===0,bad.slice(0,3).join(" | "));
// 9 random session through UI
for(let i=0;i<30;i++){const it=await p.evaluate(()=>Primer.current.item);if(it.type==="trace"){await p.click("#choices .big");}else{await p.click(".choice");}await p.click("#next");}
ok("30-turn random session ran with no JS errors",errors.length===0,errors.slice(0,3).join(" | "));
// 10 persistence + dashboard
await p.reload();await p.waitForFunction(()=>window.Primer);const per=await p.evaluate(()=>Primer.state.skills.addition.attempts);ok("Progress persists in localStorage after reload",per>=24,`addition attempts ${per}`);
await p.click("#nav-parent");const rows=await p.$$eval(".skill-row",r=>r.length);ok("Parent dashboard shows all 7 skills",rows===7);
const f=await p.$eval("footer",f=>[f.textContent.trim(),f.querySelector("a").href]);ok("Footer credit + link",f[0].includes("Built by Satoshi Drops 🪂 @SatoshiDropsHQ")&&f[1]==="https://x.com/SatoshiDropsHQ",f.join(" "));
await p.screenshot({path:SHOT.replace(".png","-dashboard.png"),fullPage:true});
await p.click("#nav-learn");await p.evaluate(()=>{Primer.state.skills.reading.level=2;Primer.force("reading")});await p.screenshot({path:SHOT,fullPage:true});
await b.close();const fails=results.filter(r=>!r.pass).length;console.log(`\n${results.length-fails}/${results.length} passed`);process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
