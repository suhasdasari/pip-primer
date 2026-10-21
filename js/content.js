// All learning content, written for ages 4-8. Each skill has 3 levels; gen(level, rnd) returns one item.
(function(){
const pick=(a,r)=>a[Math.floor(r()*a.length)];
const shuffle=(a,r)=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const distinct=(ans,pool,n,r)=>shuffle([ans,...shuffle(pool.filter(x=>x!==ans),r).slice(0,n-1)],r);
const numChoices=(ans,lo,hi,r)=>{const s=new Set([ans]);let g=0;while(s.size<3&&g++<50){const d=ans+pick([-2,-1,1,2,3],r);if(d>=lo&&d<=hi)s.add(d);}return shuffle([...s],r);};

// Letter -> key word with emoji (keyword starts with the letter's most common sound)
const LETTERS={m:["moon","🌙"],s:["sun","☀️"],t:["tiger","🐯"],a:["apple","🍎"],p:["pig","🐷"],b:["ball","⚽"],f:["fish","🐟"],c:["cat","🐱"],d:["dog","🐶"],h:["hat","🎩"],l:["leaf","🍃"],n:["nest","🪺"],r:["rabbit","🐰"],g:["goat","🐐"],i:["insect","🐛"],o:["octopus","🐙"],u:["umbrella","☂️"],e:["egg","🥚"],k:["kite","🪁"],w:["web","🕸️"],j:["jam","🍯"],v:["van","🚐"],z:["zebra","🦓"],y:["yo-yo","🪀"]};
const L1=["m","s","t","a","p","b","f","c","d","h"], L2=Object.keys(LETTERS);
const CVC=[["cat","🐱",["cot","cut","cap"]],["dog","🐶",["dig","dot","log"]],["sun","☀️",["sit","run","bun"]],["pig","🐷",["peg","big","pin"]],["bus","🚌",["bat","bun","but"]],["hat","🎩",["hot","hit","ham"]],["bed","🛏️",["bad","bud","red"]],["fox","🦊",["fix","box","fog"]],["bug","🐞",["bag","big","rug"]],["map","🗺️",["mop","man","cap"]],["net","🥅",["nut","not","wet"]],["cup","🥤",["cap","pup","cut"]]];

// Dolch sight words by list
const SIGHT=[["a","and","the","I","is","see","can","go","to","we","my","up","me","it","in","you","look","red"],
["he","she","was","said","are","have","they","like","what","this","that","with","all","here","come","ran","do","good"],
["of","from","her","his","them","then","there","when","were","after","could","every","know","once","some","would","going","put"]];

// Short original passages with literal and simple inference questions
const PASSAGES=[
[{t:"I see a cat. The cat is red. The cat can hop.",q:[["What color is the cat?","red",["red","blue","green"]],["What can the cat do?","hop",["hop","swim","fly"]]]},
 {t:"We go up the hill. We see a big tree. The tree is green.",q:[["Where do we go?","up the hill",["up the hill","to the shop","in the pool"]],["What color is the tree?","green",["green","pink","black"]]]},
 {t:"My dog is little. My dog likes to run. I like my dog.",q:[["Is the dog big or little?","little",["little","big","tall"]],["What does the dog like to do?","run",["run","sleep","read"]]]}],
[{t:"Sam has a red kite. The wind is strong today. Sam runs, and the kite goes up high into the sky.",q:[["What color is Sam's kite?","red",["red","yellow","blue"]],["Why does the kite go up?","the wind is strong",["the wind is strong","it is raining","Sam is sleeping"]]]},
 {t:"Mia plants a seed in a pot. She gives it water and puts it in the sun. Soon a small green sprout pops up.",q:[["What does Mia plant?","a seed",["a seed","a rock","a shoe"]],["What does the seed need to grow?","water and sun",["water and sun","snow and ice","toys and games"]]]},
 {t:"Ben's hands are cold. He puts on his mittens and his hat. Now Ben can play in the snow.",q:[["Why does Ben put on mittens?","his hands are cold",["his hands are cold","he is hungry","it is hot"]],["Where will Ben play?","in the snow",["in the snow","in the bath","at the beach"]]]}],
[{t:"Every night, Grandpa reads a story to Lily. Tonight the story is about a brave little turtle who swims across a wide river to find her family. Lily falls asleep before the end, so Grandpa will finish it tomorrow.",q:[["Who reads the story?","Grandpa",["Grandpa","Lily","the turtle"]],["What is the turtle looking for?","her family",["her family","a snack","a boat"]],["Why will Grandpa finish the story tomorrow?","Lily fell asleep",["Lily fell asleep","the book is lost","the turtle is tired"]]]},
 {t:"Bees fly from flower to flower. They drink a sweet juice called nectar. Back at the hive, the bees turn the nectar into honey. Bees also help flowers make seeds.",q:[["What do bees drink from flowers?","nectar",["nectar","milk","rain"]],["What do bees make from nectar?","honey",["honey","bread","wax crayons"]],["How do bees help flowers?","they help them make seeds",["they help them make seeds","they paint them","they water them"]]]},
 {t:"Leo wanted to build the tallest tower in his class. His first tower fell down. Leo tried again and put the biggest blocks at the bottom. This time his tower stood tall and did not fall.",q:[["What happened to Leo's first tower?","it fell down",["it fell down","it won a prize","it was painted"]],["What did Leo change?","big blocks at the bottom",["big blocks at the bottom","he used paper","he stopped trying"]]]}]];

const TRACE=[["L","T","I","E","H","F","O","C"],["a","c","o","s","t","m","n","i"],["b","d","g","p","q","e","k","y"]];
const OBJ=["🍎","⭐","🐟","🎈","🐞","🍓","🚗","🌼"];

const SKILLS=[
{id:"phonics",name:"Letter sounds",icon:"🔤",gen(l,r){
  if(l===1){const k=pick(L1,r),[w,e]=LETTERS[k];return{id:"ph1-"+k,prompt:`Which letter makes the first sound in ${w}?`,say:`Which letter makes the first sound in... ${w}?`,stage:e,choices:distinct(k,L1,3,r),answer:k};}
  if(l===2){const k=pick(L2,r),[w,e]=LETTERS[k];return{id:"ph2-"+k,prompt:`${e} ${w} starts with...`,say:`${w}. What letter does ${w} start with?`,stage:"",choices:distinct(k,L2,4,r),answer:k};}
  const [w,e,d]=pick(CVC,r);return{id:"ph3-"+w,prompt:"Sound it out! Which word matches the picture?",say:"Sound it out. Which word matches the picture?",stage:e,choices:shuffle([w,...d.slice(0,2)],r),answer:w,readAloud:w};}},
{id:"sight",name:"Sight words",icon:"👀",gen(l,r){const L=SIGHT[l-1],w=pick(L,r);return{id:"sw"+l+"-"+w,prompt:"Find the word you hear!",say:`Find the word... ${w}.`,stage:"",choices:distinct(w,L,l===1?3:4,r),answer:w,readAloud:w};}},
{id:"reading",name:"Reading stories",icon:"📖",gen(l,r){const p=pick(PASSAGES[l-1],r),qi=Math.floor(r()*p.q.length),[q,a,c]=p.q[qi];return{id:"rd"+l+"-"+PASSAGES[l-1].indexOf(p)+"-"+qi,prompt:q,say:p.t+" ... "+q,passage:p.t,choices:shuffle(c,r),answer:a};}},
{id:"addition",name:"Adding",icon:"➕",gen(l,r){const max=[5,10,20][l-1];const a=Math.floor(r()*(max))+ (l===3?1:0),b=Math.floor(r()*(max-a+1));const s=a+b;const o=pick(OBJ,r);
  return{id:`ad${a}+${b}`,prompt:`${a} + ${b} = ?`,say:`What is ${a} plus ${b}?`,stage:l===1?`<span class=dots>${o.repeat(a)} + ${o.repeat(b)}</span>`:"",choices:numChoices(s,0,max+3,r),answer:s};}},
{id:"subtraction",name:"Taking away",icon:"➖",gen(l,r){const max=[5,10,20][l-1];const a=Math.floor(r()*max)+1,b=Math.floor(r()*(a+1));const o=pick(OBJ,r);
  return{id:`sb${a}-${b}`,prompt:`${a} − ${b} = ?`,say:`What is ${a} take away ${b}?`,stage:l===1?`<span class=dots>${o.repeat(a-b)}${"<s>"+o.repeat(b)+"</s>"}</span>`:"",choices:numChoices(a-b,0,max,r),answer:a-b};}},
{id:"number",name:"Number sense",icon:"🔢",gen(l,r){
  if(l===1){const n=Math.floor(r()*10)+1,o=pick(OBJ,r);return{id:"ns1-"+n,prompt:"How many?",say:"Count them! How many are there?",stage:`<span class=dots>${o.repeat(n)}</span>`,choices:numChoices(n,1,12,r),answer:n};}
  if(l===2){const a=Math.floor(r()*20),b=(a+1+Math.floor(r()*19))%21;if(a===b)return this.gen(l,r);return{id:`ns2-${a}-${b}`,prompt:"Which number is bigger?",say:`Which number is bigger, ${a} or ${b}?`,choices:shuffle([a,b],r),answer:Math.max(a,b)};}
  if(r()<.5){const n=Math.floor(r()*90)+5;return{id:"ns3n-"+n,prompt:`What comes next? ${n-2}, ${n-1}, ${n}, ___`,say:`What number comes next? ${n-2}, ${n-1}, ${n}...`,choices:numChoices(n+1,0,100,r),answer:n+1};}
  const t=Math.floor(r()*9)+1,o=Math.floor(r()*10),n=t*10+o;return{id:"ns3p-"+n,prompt:`${t} tens and ${o} ones make...`,say:`${t} tens and ${o} ones make what number?`,stage:`<span class=dots>${"🟦".repeat(t)} ${"▪️".repeat(o)}</span>`,choices:shuffle([n,o*10+t===n?n+10:o*10+t,n+1].filter((v,i,a)=>a.indexOf(v)===i),r),answer:n};}},
{id:"writing",name:"Writing letters",icon:"✏️",gen(l,r){const c=pick(TRACE[l-1],r);return{id:"wr"+l+"-"+c,type:"trace",prompt:`Trace the letter ${c}`,say:`Trace the letter ${c.toUpperCase()===c?"capital ":"little "}${c}. Follow the gray letter with your finger.`,answer:c};}}
];
window.PRIMER_CONTENT={SKILLS,LETTERS,SIGHT,PASSAGES,TRACE};
})();
