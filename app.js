const KEY="asalpay_v2";
const PHONE_RE=/^\+2526[3-9]\d{7}$/;
let state=loadState();
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

function loadState(){
  try{
    const saved=JSON.parse(localStorage.getItem(KEY));
    return saved&&Array.isArray(saved.users)&&Array.isArray(saved.tx)?saved:{users:[],current:null,tx:[]};
  }catch{return {users:[],current:null,tx:[]}}
}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function user(){return state.users.find(u=>u.phone===state.current)}
function money(n){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(n)||0)}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function normalizePhone(value){
  const raw=String(value||"").trim().replace(/[\s()-]/g,"");
  if(raw.startsWith("00252")) return "+"+raw.slice(2);
  return raw;
}
function validPhone(value){return PHONE_RE.test(normalizePhone(value))}
function phoneMessage(value){return "Use a valid Somali mobile number such as +252 63 0000000."}
function toast(message){
  const e=$("#toast");e.textContent=message;e.classList.add("show");
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>e.classList.remove("show"),2400);
}
function showAuth(view){$("#loginView").hidden=view!=="login";$("#registerView").hidden=view!=="register"}
function page(name){
  $$(".page").forEach(x=>x.classList.toggle("active",x.id===name));
  $$(".bottom button").forEach(x=>x.classList.toggle("active",x.dataset.page===name));
  window.scrollTo({top:0,behavior:"smooth"});
}
function icon(type){
  return type==="in"
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M7 14l5 5 5-5"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M7 10l5-5 5 5"/></svg>';
}
function renderTx(selector,arr){
  const e=$(selector);
  if(!arr.length){e.innerHTML='<div class="empty">No transactions yet.</div>';return}
  e.innerHTML=arr.map(t=>{
    const positive=t.type==="in";
    return '<div class="tx"><div class="tx-icon '+(positive?"in":"out")+'">'+icon(t.type)+'</div><div class="tx-main"><b>'+esc(t.title)+'</b><span>'+esc(t.note||"")+(t.note?" · ":"")+new Date(t.date).toLocaleString()+'</span></div><div class="tx-amount '+(positive?"positive":"negative")+'">'+(positive?"+":"-")+money(t.amount)+'</div></div>';
  }).join("");
}
function render(){
  const u=user(),auth=$("#auth"),app=$("#app");
  if(!u){
    auth.hidden=false;auth.style.display="grid";app.hidden=true;app.style.display="none";
    return;
  }
  auth.hidden=true;auth.style.display="none";app.hidden=false;app.style.display="block";
  $("#helloName").textContent=u.name;
  $("#walletPhone").textContent=u.phone;
  $("#balance").textContent=money(u.balance);
  $("#profileName").textContent=u.name;
  $("#profilePhone").textContent=u.phone;
  $("#avatar").textContent=(u.name[0]||"A").toUpperCase();
  $("#walletId").textContent=u.id;
  renderTx("#recent",state.tx.filter(t=>t.owner===u.phone).slice(0,5));
  renderTx("#allTransactions",state.tx.filter(t=>t.owner===u.phone));
}
function validateAmount(amount){
  return Number.isFinite(amount)&&amount>0;
}
function confirmTransfer(recipient,amount,note){
  const sender=user();
  const target=state.users.find(u=>u.phone===recipient);
  if(!target)return toast("That phone number is not registered.");
  if(target.phone===sender.phone)return toast("You cannot send money to yourself.");
  if(!validateAmount(amount))return toast("Enter a valid amount.");
  if(amount>sender.balance)return toast("Insufficient balance.");
  const ok=confirm("Send "+money(amount)+" to "+recipient+"?");
  if(!ok)return;
  sender.balance=Number((sender.balance-amount).toFixed(2));
  target.balance=Number((target.balance+amount).toFixed(2));
  const now=Date.now();
  state.tx.unshift({id:"TX-"+now+"-"+Math.random().toString(36).slice(2,7),owner:sender.phone,type:"out",title:"Sent to "+target.name,note,amount,date:now});
  state.tx.unshift({id:"TX-"+now+"-"+Math.random().toString(36).slice(2,7),owner:target.phone,type:"in",title:"Received from "+sender.name,note,amount,date:now});
  save();$("#sendForm").reset();render();page("home");toast("Transfer completed.");
}

$$("[data-auth]").forEach(b=>b.onclick=()=>showAuth(b.dataset.auth));

$("#loginForm").onsubmit=e=>{
  e.preventDefault();
  const phone=normalizePhone($("#loginPhone").value),password=$("#loginPassword").value;
  if(!validPhone(phone))return toast(phoneMessage(phone));
  const u=state.users.find(x=>x.phone===phone);
  if(!u||u.password!==password)return toast("Incorrect phone number or password.");
  state.current=phone;save();render();page("home");
};

$("#registerForm").onsubmit=e=>{
  e.preventDefault();
  const name=$("#regName").value.trim();
  const phone=normalizePhone($("#regPhone").value);
  const password=$("#regPassword").value;
  const password2=$("#regPassword2").value;
  if(name.length<2)return toast("Enter your full name.");
  if(!validPhone(phone))return toast(phoneMessage(phone));
  if(password.length<8)return toast("Password must be at least 8 characters.");
  if(password!==password2)return toast("Passwords do not match.");
  if(state.users.some(u=>u.phone===phone))return toast("That phone number is already registered.");
  const id="ASL-"+Math.floor(100000+Math.random()*900000);
  state.users.push({id,name,phone,password,balance:0});
  state.current=phone;
  save();render();page("home");$("#registerForm").reset();toast("Account created.");
};

$("#logout").onclick=()=>{state.current=null;save();showAuth("login");render()};

$$("[data-page]").forEach(b=>b.onclick=()=>page(b.dataset.page));
$$("[data-action]").forEach(b=>b.onclick=()=>{
  const action=b.dataset.action;
  if(action==="qr"){const u=user();return toast("Wallet ID: "+u.id+" · "+u.phone)}
  page(action);
});

$("#sendForm").onsubmit=e=>{
  e.preventDefault();
  const phone=normalizePhone($("#sendPhone").value);
  if(!validPhone(phone))return toast(phoneMessage(phone));
  confirmTransfer(phone,Number($("#sendAmount").value),$("#sendNote").value.trim());
};

$("#requestForm").onsubmit=e=>{
  e.preventDefault();
  const requester=user(),phone=normalizePhone($("#requestPhone").value),amount=Number($("#requestAmount").value),note=$("#requestNote").value.trim();
  if(!validPhone(phone))return toast(phoneMessage(phone));
  const target=state.users.find(u=>u.phone===phone);
  if(!target)return toast("That phone number is not registered.");
  if(target.phone===requester.phone)return toast("You cannot request money from yourself.");
  if(!validateAmount(amount))return toast("Enter a valid amount.");
  const now=Date.now();
  state.tx.unshift({id:"RQ-"+now,owner:requester.phone,type:"in",title:"Request to "+target.name,note,amount,date:now});
  state.tx.unshift({id:"RQ-"+now+"-r",owner:target.phone,type:"out",title:"Payment request from "+requester.name,note,amount,date:now});
  save();$("#requestForm").reset();render();page("home");toast("Payment request recorded.");
};

$("#hideBalance").onclick=()=>{
  const e=$("#balance"),hidden=e.dataset.hidden==="true";
  e.dataset.hidden=String(!hidden);
  e.textContent=hidden?money(user().balance):"••••••";
  $("#hideBalance").setAttribute("aria-label",hidden?"Hide balance":"Show balance");
};

render();