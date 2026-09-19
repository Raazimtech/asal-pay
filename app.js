const KEY="asalpay_demo_v1";
const seed={users:[{id:"ASL-10001",name:"Demo User",phone:"+252630000000",pin:"1234",balance:250}],current:"+252630000000",tx:[{id:"TX-1001",type:"in",title:"Welcome credit",note:"Demo balance",amount:250,date:Date.now()}]};
let state=JSON.parse(localStorage.getItem(KEY)||"null")||seed; state.current=null;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function user(){return state.users.find(u=>u.phone===state.current)}
function money(n){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(n)}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2200)}
function showAuth(v){$("#loginView").hidden=v!=="login";$("#registerView").hidden=v!=="register"}
function page(p){$$(".page").forEach(x=>x.classList.toggle("active",x.id===p));$$(".bottom button").forEach(x=>x.classList.toggle("active",x.dataset.page===p));window.scrollTo({top:0,behavior:"smooth"})}
function renderTx(sel,arr){const e=$(sel);if(!arr.length){e.innerHTML='<div class="muted">No transactions yet.</div>';return}e.innerHTML=arr.map(t=>'<div class="tx"><div class="tx-icon '+t.type+'">'+(t.type==="in"?"↓":"↑")+'</div><div class="tx-main"><b>'+esc(t.title)+'</b><span>'+esc(t.note||"")+' · '+new Date(t.date).toLocaleString()+'</span></div><div class="tx-amount">'+(t.type==="in"?"+":"-")+money(t.amount)+'</div></div>').join("")}
function render(){const u=user();if(!u){$("#auth").hidden=false;$("#app").hidden=true;return}$("#auth").hidden=true;$("#app").hidden=false;$("#helloName").textContent=u.name;$("#walletPhone").textContent=u.phone;$("#balance").textContent=money(u.balance);$("#profileName").textContent=u.name;$("#profilePhone").textContent=u.phone;$("#avatar").textContent=u.name[0].toUpperCase();$("#walletId").textContent=u.id;renderTx("#recent",state.tx.slice(0,5));renderTx("#allTransactions",state.tx)}
function modal(html){$("#modalContent").innerHTML=html;$("#modal").hidden=false}
function close(){ $("#modal").hidden=true }
function confirmSend(phone,amount,note){const u=user();if(amount<=0)return toast("Enter a valid amount");if(amount>u.balance)return toast("Insufficient balance");modal('<h2>Confirm transfer</h2><p class="muted">Send to <b>'+esc(phone)+'</b></p><div class="confirm-amount">'+money(amount)+'</div><p class="muted">'+esc(note||"No note")+'</p><div class="modal-actions"><button class="primary" id="confirmSend">Send money</button><button class="icon-btn" id="cancelModal">Cancel</button></div>');$("#confirmSend").onclick=()=>{u.balance-=amount;state.tx.unshift({id:"TX-"+Date.now(),type:"out",title:"Sent to "+phone,note,amount,date:Date.now()});save();close();$("#sendForm").reset();render();page("home");toast("Money sent successfully")};$("#cancelModal").onclick=close}
$$("[data-auth]").forEach(b=>b.onclick=()=>showAuth(b.dataset.auth));
$("#loginForm").onsubmit=e=>{e.preventDefault();const phone=$("#loginPhone").value.trim(),pin=$("#loginPin").value,u=state.users.find(x=>x.phone===phone);if(!u||u.pin!==pin)return toast("Invalid phone or PIN");state.current=phone;save();render()};
$("#registerForm").onsubmit=e=>{e.preventDefault();const name=$("#regName").value.trim(),phone=$("#regPhone").value.trim(),pin=$("#regPin").value;if(!/^\d{4}$/.test(pin))return toast("PIN must be 4 digits");if(state.users.some(u=>u.phone===phone))return toast("Phone already registered");state.users.push({id:"ASL-"+Math.floor(10000+Math.random()*90000),name,phone,pin,balance:0});state.current=phone;save();render();toast("Wallet created")};
$("#logout").onclick=()=>{state.current=null;save();render();showAuth("login")};
$$("[data-page]").forEach(b=>b.onclick=()=>page(b.dataset.page));
$$("[data-action]").forEach(b=>b.onclick=()=>{if(b.dataset.action==="qr"){modal('<h2>My Asal Pay QR</h2><div style="text-align:center;padding:30px;font-size:70px">▦</div><p class="muted" style="text-align:center">'+esc(user().phone)+'</p>');return}page(b.dataset.action)});
$("#sendForm").onsubmit=e=>{e.preventDefault();confirmSend($("#sendPhone").value.trim(),Number($("#sendAmount").value),$("#sendNote").value.trim())};
$("#requestForm").onsubmit=e=>{e.preventDefault();const p=$("#requestPhone").value.trim(),a=Number($("#requestAmount").value);if(a<=0)return toast("Enter a valid amount");state.tx.unshift({id:"RQ-"+Date.now(),type:"in",title:"Request from "+p,note:$("#requestNote").value.trim(),amount:a,date:Date.now()});save();$("#requestForm").reset();render();page("home");toast("Payment request created")};
$("#topupForm").onsubmit=e=>{e.preventDefault();const a=Number($("#topupAmount").value);if(a<=0)return toast("Enter a valid amount");const u=user();u.balance+=a;state.tx.unshift({id:"TP-"+Date.now(),type:"in",title:"Wallet top-up",note:"Demo provider",amount:a,date:Date.now()});save();$("#topupForm").reset();render();page("home");toast("Wallet funded")};
$("#hideBalance").onclick=()=>{const e=$("#balance");e.dataset.hidden=e.dataset.hidden!=="true";e.textContent=e.dataset.hidden==="true"?"••••••":money(user().balance)};
$("#resetDemo").onclick=()=>{if(confirm("Reset this demo wallet?")){localStorage.removeItem(KEY);location.reload()}};
$("#closeModal").onclick=close;$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")close()});
render();