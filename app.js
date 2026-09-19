import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
const db=createClient("https://dpiwdhtbhwjgatvcfkcb.supabase.co","sb_publishable_PSZnTEo74jObih_6TTpXVQ_tJwzTnXY");
let session=null,profile=null,wallet=null,txs=[],tab="home";
const $=s=>document.querySelector(s);
const esc=s=>String(s||"").replace(/[&<>]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
const money=n=>"$"+Number(n||0).toFixed(2);
const msg=e=>String(e||"Error").replace("Invalid login credentials","Email or password is incorrect.");
const date=d=>new Date(d).toLocaleString("en-US",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
function auth(reg=false,error=""){
 document.body.innerHTML='<div id="app"><main class="auth"><div class="brand"><div class="logo">A</div><div><small>SMART MONEY</small><h1>Asal Pay</h1></div></div><section class="card"><span class="pill">● VIRTUAL WALLET MVP</span><h2>'+ (reg?"Create your wallet":"Welcome back") +'</h2><p>'+ (reg?"Start with $1,000 virtual USD.":"Sign in to your wallet.") +'</p><form id="form">'+(reg?'<label>Full name<input id="name" required></label>':"")+'<label>Email<input id="email" type="email" required></label><label>Password<input id="pass" type="password" minlength="6" required></label><button class="primary">'+(reg?"Create account":"Sign in")+'</button></form><div class="msg '+(error?"bad":"hide")+'">'+esc(error)+'</div><button id="switch" class="link">'+(reg?"Already registered? Sign in":"New here? Create an account")+'</button><div class="demo"><b>Demo only</b><span>New accounts receive $1,000 virtual USD. No real money is moved.</span></div></section></main></div>';
 $("#switch").onclick=()=>auth(!reg);
 $("#form").onsubmit=async e=>{e.preventDefault();let b=e.target.querySelector("button");b.disabled=true;try{let r;if(reg)r=await db.auth.signUp({email:$("#email").value.trim(),password:$("#pass").value,options:{data:{full_name:$("#name").value.trim()}}});else r=await db.auth.signInWithPassword({email:$("#email").value.trim(),password:$("#pass").value});if(r.error)throw r.error;if(r.data.session)await boot(r.data.session);else auth(false,"Account created. Check your email, then sign in.");}catch(x){auth(reg,msg(x.message));}};
}
async function load(){
 let id=session.user.id;
 let a=await Promise.all([db.from("asal_profiles").select("*").eq("id",id).single(),db.from("asal_wallets").select("*").eq("user_id",id).single(),db.from("asal_transactions").select("*").or("sender_id.eq."+id+",recipient_id.eq."+id).order("created_at",{ascending:false}).limit(100)]);
 a.forEach(x=>{if(x.error)throw x.error});profile=a[0].data;wallet=a[1].data;txs=a[2].data||[];
}
function shell(){
 let n=profile.full_name||session.user.email.split("@")[0];
 document.body.innerHTML='<main class="app"><header><div><small>ASAL PAY</small><h1>Hello, '+esc(n.split(" ")[0])+'</h1></div><button id="prof" class="avatar">'+esc(n[0].toUpperCase())+'</button></header><section id="screen"></section><nav><button data-t="home">⌂<span>Home</span></button><button data-t="activity">↕<span>Activity</span></button><button data-t="profile">○<span>Profile</span></button></nav></main>';
 document.querySelectorAll("[data-t]").forEach(x=>x.onclick=()=>{tab=x.dataset.t;render()});
 $("#prof").onclick=()=>{tab="profile";render()};render();
}
function list(a){
 if(!a.length)return '<div class="empty"><b>No transactions yet</b><span>Send money to another registered demo user.</span></div>';
 return '<div class="tx">'+a.map(x=>{let out=x.sender_id===session.user.id;return '<article><i class="'+(out?"out":"in")+'">'+(out?"↗":"↙")+'</i><div><b>'+ (out?"Money sent":"Money received")+'</b><span>'+esc(x.note||"Transfer")+'</span><small>'+date(x.created_at)+'</small></div><strong class="'+(out?"neg":"pos")+'">'+(out?"-":"+")+money(x.amount)+'</strong></article>'}).join("")+'</div>';
}
function render(){
 document.querySelectorAll("[data-t]").forEach(x=>x.classList.toggle("active",x.dataset.t===tab));
 let h="";
 if(tab==="home")h='<div class="balance"><div><span>Available balance</span><b>DEMO</b></div><strong>'+money(wallet.balance)+'</strong><small>USD · Virtual wallet</small></div><div class="actions"><button id="send"><i>↗</i><b>Send</b><span>Transfer money</span></button><button id="receive"><i>↓</i><b>Receive</b><span>Share details</span></button></div><div class="head"><h2>Recent activity</h2><button id="all">See all</button></div>'+list(txs.slice(0,5))+'<div class="demo"><b>Demo environment</b><span>Real payment rails are not connected.</span></div>';
 else if(tab==="activity")h='<div class="title"><small>WALLET</small><h2>Activity</h2><p>All virtual-money movements.</p></div>'+list(txs);
 else h='<div class="title"><small>ACCOUNT</small><h2>Profile</h2><p>'+esc(session.user.email)+'</p></div><div class="profile"><div class="avatar">'+esc((profile.full_name||"A")[0].toUpperCase())+'</div><div><b>'+esc(profile.full_name||"Asal Pay user")+'</b><span>'+esc(session.user.email)+'</span></div></div><button class="wide" id="edit">Edit profile</button><button class="wide danger" id="logout">Sign out</button>';
 $("#screen").innerHTML=h;
 if($("#send"))$("#send").onclick=sendModal;if($("#receive"))$("#receive").onclick=receiveModal;if($("#all"))$("#all").onclick=()=>{tab="activity";render()};
 if($("#edit"))$("#edit").onclick=editModal;if($("#logout"))$("#logout").onclick=async()=>{await db.auth.signOut();session=null;auth()};
}
function modal(html){let d=document.createElement("div");d.className="overlay";d.innerHTML=html;document.body.appendChild(d);d.onclick=e=>{if(e.target===d)d.remove()};d.querySelector(".close").onclick=()=>d.remove();return d}
function sendModal(){
 let d=modal('<section class="modal"><button class="close">×</button><small>TRANSFER</small><h2>Send money</h2><p>Transfer virtual USD to another Asal Pay account.</p><form id="sendform"><label>Recipient email<input id="to" type="email" required></label><label>Amount<input id="amt" type="number" min=".01" step=".01" required></label><label>Note <em>optional</em><input id="note" maxlength="120"></label><button class="primary">Send money</button></form><div id="err"></div></section>');
 $("#sendform").onsubmit=async e=>{e.preventDefault();let b=e.target.querySelector("button");b.disabled=true;try{let r=await db.rpc("asal_send_money",{recipient_email:$("#to").value.trim(),transfer_amount:Number($("#amt").value),transfer_note:$("#note").value.trim()||null});if(r.error)throw r.error;d.remove();await load();render();toast("Money sent successfully.");}catch(x){$("#err").innerHTML='<div class="msg bad">'+esc(msg(x.message))+'</div>';b.disabled=false;}};
}
function receiveModal(){modal('<section class="modal center"><button class="close">×</button><small>RECEIVE</small><h2>Your payment details</h2><div class="receive"><div class="logo">A</div><b>'+esc(profile.full_name||"Asal Pay user")+'</b><span>'+esc(session.user.email)+'</span><small>Share this email with another demo user.</small></div><button class="primary close">Done</button></section>')}
function editModal(){
 let d=modal('<section class="modal"><button class="close">×</button><small>ACCOUNT</small><h2>Edit profile</h2><form id="pf"><label>Full name<input id="pn" required value="'+esc(profile.full_name||"")+'"></label><button class="primary">Save changes</button></form><div id="pe"></div></section>');
 $("#pf").onsubmit=async e=>{e.preventDefault();let r=await db.from("asal_profiles").update({full_name:$("#pn").value.trim()}).eq("id",session.user.id);if(r.error){$("#pe").innerHTML='<div class="msg bad">'+esc(r.error.message)+'</div>';return}profile.full_name=$("#pn").value.trim();d.remove();shell();toast("Profile updated.")};
}
function toast(s){let x=document.createElement("div");x.className="toast";x.textContent=s;document.body.appendChild(x);setTimeout(()=>x.remove(),3000)}
async function boot(s){session=s;await load();shell()}
(async()=>{document.body.innerHTML='<main class="loading"><div class="logo">A</div><b>Asal Pay</b><span>Loading…</span></main>';try{let r=await db.auth.getSession();if(r.data.session)await boot(r.data.session);else auth();db.auth.onAuthStateChange(async(_,s)=>{if(s&&!session)try{await boot(s)}catch(e){auth(false,msg(e.message))}})}catch(e){auth(false,msg(e.message))}})();