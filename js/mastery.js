// Mastery model: Bayesian Knowledge Tracing per skill-level + Leitner spaced repetition per item.
(function(){
const P={init:.2,learn:.15,slip:.1,guess:.25};
const MASTER=.95, STRUGGLE=.3, MIN_ATTEMPTS=3, MAX_LEVEL=3;
const BOX_MS=[0,60e3,5*60e3,30*60e3,24*3600e3,3*24*3600e3]; // review intervals by box
function bktUpdate(pL,correct,guess=P.guess){
  const post=correct? pL*(1-P.slip)/(pL*(1-P.slip)+(1-pL)*guess) : pL*P.slip/(pL*P.slip+(1-pL)*(1-guess));
  return Math.min(.99,Math.max(.01,post+(1-post)*P.learn));} // clamp so evidence can always move the estimate
function newSkill(){return{level:1,pL:P.init,attempts:0,correct:0,levelAttempts:0,history:[],mastered:[]};}
function record(state,skillId,itemId,correct,nChoices,now=Date.now()){
  const s=state.skills[skillId]||(state.skills[skillId]=newSkill());
  const guess=nChoices?Math.min(.5,1/nChoices):.1;
  const before={level:s.level,pL:s.pL};
  s.pL=bktUpdate(s.pL,correct,guess);s.attempts++;s.levelAttempts++;if(correct)s.correct++;
  s.history.push({t:now,c:correct?1:0,l:s.level});if(s.history.length>200)s.history.shift();
  // item-level spaced repetition
  const it=state.items[itemId]||(state.items[itemId]={box:0,due:0,seen:0});
  it.seen++;it.box=correct?Math.min(BOX_MS.length-1,it.box+1):0;it.due=now+BOX_MS[it.box];it.skill=skillId;
  let change=null;
  if(s.pL>=MASTER&&s.levelAttempts>=MIN_ATTEMPTS){ if(!s.mastered.includes(s.level))s.mastered.push(s.level);
    if(s.level<MAX_LEVEL&&s.levelAttempts>=MIN_ATTEMPTS){s.level++;s.pL=P.init+.1;s.levelAttempts=0;change="up";} }
  const recent=s.history.filter(h=>h.l===s.level).slice(-4), recentMiss=recent.length===4&&recent.filter(h=>!h.c).length>=3;
  if(change){} else if(s.level>1&&s.levelAttempts>=MIN_ATTEMPTS&&(s.pL<STRUGGLE||recentMiss)){s.level--;s.pL=.6;s.levelAttempts=0;change="down";}
  return{before,after:{level:s.level,pL:s.pL},change};}
function overall(s){ // 0..1 progress across all levels
  if(!s)return 0;return Math.min(1,(s.level-1+(s.pL>=MASTER?1:s.pL))/MAX_LEVEL);} // based on where the child is now
// choose next skill: prefer due reviews, otherwise lowest progress with some randomness; avoid repeating last skill
function chooseSkill(state,ids,rnd,now=Date.now()){
  const due=Object.entries(state.items).filter(([k,v])=>v.box<3&&v.due<=now&&v.seen>0&&ids.includes(v.skill)&&v.skill!==state.last);
  if(due.length&&rnd()<.35)return{skill:due[0][1].skill,reviewItem:due[0][0]};
  const w=ids.filter(i=>i!==state.last).map(i=>[i,1.2-overall(state.skills[i])]);
  let tot=w.reduce((a,b)=>a+b[1],0),x=rnd()*tot;for(const [i,v] of w){if((x-=v)<=0)return{skill:i};}return{skill:w[0][0]};}
window.PrimerMastery={P,MASTER,bktUpdate,newSkill,record,overall,chooseSkill,BOX_MS};
if(typeof module!=="undefined")module.exports=window.PrimerMastery;
})();
