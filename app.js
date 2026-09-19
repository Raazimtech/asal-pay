const SUPABASE_URL='https://dpiwdhtbhwjgatvcfkcb.supabase.co';
const SUPABASE_KEY='sb_publishable_PSZnTEo74jObih_6TTpXVQ_tJwzTnXY';
const db=supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

const PHONE_RE=/^\+2526[3-9]\d{7}$/;
let user=null,profile=null,wallet=null;

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

function esc(s){
  return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
function money(n){
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n)||0);
}
function normalizePhone(value){
  const raw=String(value||'').trim().replace(/[\s()-]/g,'');
  if(raw.startsWith('00252')) return '+'+raw.slice(2);
  return raw;
}
function validPhone(value){return PHONE_RE.test(normalizePhone(value));}
function phoneMessage(){return 'Use a valid Somali mobile number such as +252 63 0000000.';}
function authEmail(phone){return 'u_'+normalizePhone(phone).replace(/\D/g,'')+'@auth.asalpay.local';}

function toast(message){
  const e=$('#toast');
  e.textContent=message;
  e.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer=setTimeout(()=>e.classList.remove('show'),2600);
}
function showAuth(view){
  $('#loginView').hidden=view!=='login';
  $('#registerView').hidden=view!=='register';
}
function page(name){
  $$('.page').forEach(x=>x.classList.toggle('active',x.id===name));
  $$('.bottom button').forEach(x=>x.classList.toggle('active',x.dataset.page===name));
  window.scrollTo({top:0,behavior:'smooth'});
}
function icon(type){
  return type==='in'
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M7 14l5 5 5-5"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M7 10l5-5 5 5"/></svg>';
}
function renderTx(selector,arr){
  const e=$(selector);
  if(!arr.length){e.innerHTML='<div class="empty">No transactions yet.</div>';return}
  e.innerHTML=arr.map(t=>{
    const positive=t.type==='in';
    return '<div class="tx"><div class="tx-icon '+(positive?'in':'out')+'">'+icon(t.type)+'</div><div class="tx-main"><b>'+esc(t.title)+'</b><span>'+esc(t.note||'')+(t.note?' · ':'')+new Date(t.date).toLocaleString()+'</span></div><div class="tx-amount '+(positive?'positive':'negative')+'">'+(positive?'+':'-')+money(t.amount)+'</div></div>';
  }).join('');
}

async function loadAccount(){
  if(!user)return;
  const {data:p,error:pe}=await db.from('asal_profiles')
    .select('id,full_name,email,phone,active,wallet_id,created_at,asal_wallets(balance,currency)')
    .eq('id',user.id).single();

  if(pe){toast(pe.message||'Could not load your account.');return false;}
  if(p.active===false){await db.auth.signOut();toast('Your account is suspended.');return false;}

  profile=p;
  wallet=Array.isArray(p.asal_wallets)?p.asal_wallets[0]:p.asal_wallets;
  return true;
}

async function loadTransactions(){
  if(!user)return;
  const {data,error}=await db.from('asal_transactions')
    .select('*')
    .or('sender_id.eq.'+user.id+',recipient_id.eq.'+user.id)
    .order('created_at',{ascending:false})
    .limit(100);

  if(error){toast(error.message||'Could not load transactions.');return [];}

  return (data||[]).map(t=>{
    const incoming=t.recipient_id===user.id;
    return {
      id:t.id,
      type:incoming?'in':'out',
      title:incoming?'Received money':'Sent money',
      note:t.note||t.transaction_type||'Transfer',
      amount:Number(t.amount),
      date:t.created_at
    };
  });
}

async function render(){
  if(!user){
    $('#auth').hidden=false;
    $('#auth').style.display='grid';
    $('#app').hidden=true;
    $('#app').style.display='none';
    return;
  }

  if(!(await loadAccount())){
    $('#auth').hidden=false;
    $('#app').hidden=true;
    return;
  }

  $('#auth').hidden=true;
  $('#auth').style.display='none';
  $('#app').hidden=false;
  $('#app').style.display='block';

  const balance=Number(wallet?.balance||0);
  const name=profile.full_name||'Asal Pay user';

  $('#helloName').textContent=name;
  $('#walletPhone').textContent=profile.phone||'';
  $('#balance').textContent=money(balance);
  $('#profileName').textContent=name;
  $('#profilePhone').textContent=profile.phone||'';
  $('#avatar').textContent=(name[0]||'A').toUpperCase();
  $('#walletId').textContent=profile.wallet_id||'—';

  const tx=await loadTransactions();
  renderTx('#recent',tx.slice(0,5));
  renderTx('#allTransactions',tx);
}

async function boot(){
  const {data}=await db.auth.getSession();
  if(data.session){
    user=data.session.user;
    await render();
  }
  db.auth.onAuthStateChange(async(event,session)=>{
    if(session && !user){
      user=session.user;
      await render();
    }else if(!session && user){
      user=null;profile=null;wallet=null;
      await render();
    }
  });
}

$$('[data-auth]').forEach(b=>b.onclick=()=>showAuth(b.dataset.auth));

$('#loginForm').onsubmit=async e=>{
  e.preventDefault();
  const phone=normalizePhone($('#loginPhone').value);
  const password=$('#loginPassword').value;

  if(!validPhone(phone))return toast(phoneMessage());

  const {data,error}=await db.auth.signInWithPassword({
    email:authEmail(phone),
    password
  });

  if(error)return toast('Incorrect phone number or password.');
  user=data.user;
  await render();
  page('home');
};

$('#registerForm').onsubmit=async e=>{
  e.preventDefault();

  const name=$('#regName').value.trim();
  const phone=normalizePhone($('#regPhone').value);
  const password=$('#regPassword').value;
  const password2=$('#regPassword2').value;

  if(name.length<2)return toast('Enter your full name.');
  if(!validPhone(phone))return toast(phoneMessage());
  if(password.length<8)return toast('Password must be at least 8 characters.');
  if(password!==password2)return toast('Passwords do not match.');

  const button=$('#registerForm button[type="submit"]');
  button.disabled=true;

  try{
    const response=await fetch(SUPABASE_URL+'/functions/v1/asal-signup',{
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':SUPABASE_KEY},
      body:JSON.stringify({full_name:name,phone,password})
    });
    const result=await response.json();

    if(!response.ok||!result?.ok){
      return toast(result?.error||'Could not create account.');
    }

    const {data,error}=await db.auth.signInWithPassword({
      email:authEmail(phone),
      password
    });

    if(error)return toast('Account created, but sign-in failed. Please sign in again.');

    user=data.user;
    $('#registerForm').reset();
    await render();
    page('home');
    toast('Account created.');
  }catch(error){
    toast(error?.message||'Could not reach Asal Pay.');
  }finally{
    button.disabled=false;
  }
};

$('#logout').onclick=async()=>{
  await db.auth.signOut();
  user=null;profile=null;wallet=null;
  showAuth('login');
  await render();
};

$$('[data-page]').forEach(b=>b.onclick=()=>page(b.dataset.page));
$$('[data-action]').forEach(b=>b.onclick=async()=>{
  const action=b.dataset.action;
  if(action==='qr'){
    return toast('Wallet ID: '+(profile?.wallet_id||'—')+' · '+(profile?.phone||''));
  }
  page(action);
});

$('#sendForm').onsubmit=async e=>{
  e.preventDefault();
  if(!user)return;

  const phone=normalizePhone($('#sendPhone').value);
  const amount=Number($('#sendAmount').value);
  const note=$('#sendNote').value.trim();

  if(!validPhone(phone))return toast(phoneMessage());
  if(!Number.isFinite(amount)||amount<=0)return toast('Enter a valid amount.');

  const {data:target,error:targetError}=await db.from('asal_profiles')
    .select('id,email,phone,full_name,active')
    .eq('phone',phone).maybeSingle();

  if(targetError)return toast(targetError.message);
  if(!target)return toast('That phone number is not registered.');
  if(target.id===user.id)return toast('You cannot send money to yourself.');
  if(target.active===false)return toast('That account is suspended.');

  const {data,error}=await db.rpc('asal_send_money',{
    recipient_email:target.email,
    transfer_amount:amount,
    transfer_note:note||null
  });

  if(error)return toast(error.message||'Transfer failed.');

  $('#sendForm').reset();
  await render();
  page('home');
  toast('Transfer completed.');
};

$('#requestForm').onsubmit=async e=>{
  e.preventDefault();
  toast('Payment requests are not enabled in the backend yet.');
};

$('#hideBalance').onclick=()=>{
  const e=$('#balance');
  const hidden=e.dataset.hidden==='true';
  e.dataset.hidden=String(!hidden);
  e.textContent=hidden?money(wallet?.balance):'••••••';
  $('#hideBalance').setAttribute('aria-label',hidden?'Hide balance':'Show balance');
};

boot();