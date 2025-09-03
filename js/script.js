(function(){
  const byId = id => document.getElementById(id);
  const qs = sel => document.querySelector(sel);
  const numOnly = s => s.replace(/\D+/g,'');

  const card = byId('card-number');
  const mm = byId('expiry-month');
  const yy = byId('expiry-year');
  const cvv = byId('cvv');
  const name = byId('cardholder-name');
  const form = byId('pay-form');

  // ---------- formatting & validation ----------
  function group16(v){
    const n = numOnly(v).slice(0,16);
    return n.replace(/(.{4})/g,'$1 ').trim();
  }
  function luhnOk(n){
    let sum=0, alt=false;
    for(let i=n.length-1;i>=0;i--){
      let d = +n[i];
      if(alt){ d*=2; if(d>9) d-=9; }
      sum+=d; alt=!alt;
    }
    return sum%10===0;
  }
  function showError(id,msg){const el=byId(id); if(el){ el.textContent=msg||''; }}
  function setInvalid(input, invalid){ input.classList.toggle('is-invalid', !!invalid); }

  // card number
  card.addEventListener('input', ()=>{
    const caret = card.selectionStart;
    const before = card.value;
    card.value = group16(card.value);
    if(document.activeElement===card){
      const diff = card.value.length - before.length;
      card.setSelectionRange(caret+diff, caret+diff);
    }
    const digits = numOnly(card.value);
    if(digits.length===16){
      const ok = luhnOk(digits);
      setInvalid(card, !ok);
      showError('card-number-error', ok ? '' : 'Проверьте номер карты');
    } else {
      setInvalid(card, true);
      showError('card-number-error', 'Введите 16 цифр');
    }
  });

  // month 01..12
  mm.addEventListener('input',()=>{
    let v = numOnly(mm.value).slice(0,2);
    if(v.length===1 && +v>1) v='0'+v; // 2..9 => 02..09
    if(v.length===2){
      const n=+v; if(n<1) v='01'; if(n>12) v='12';
    }
    mm.value=v;
    setInvalid(mm, v.length!==2);
    showError('expiry-month-error', v.length===2? '' : 'MM');
    if(v.length===2) yy.focus();
  });

  // year >= current YY
  yy.addEventListener('input',()=>{
    let v = numOnly(yy.value).slice(0,2);
    yy.value=v;
    const curYY = +(new Date().getFullYear().toString().slice(-2));
    let invalid = v.length!==2;
    if(!invalid){
      const y = +v;
      invalid = (y < curYY);
    }
    setInvalid(yy, invalid);
    showError('expiry-year-error', invalid? 'YY' : '');
    if(!invalid) cvv.focus();
  });

  // cvv
  cvv.addEventListener('input',()=>{
    const v = numOnly(cvv.value).slice(0,3); cvv.value=v;
    const invalid = v.length!==3; setInvalid(cvv, invalid);
    showError('cvv-error', invalid? '***' : '');
  });

  // name (latin, uppercase)
  name.addEventListener('input',()=>{
    let v = name.value.toUpperCase();
    v = v.replace(/[^A-Z\s\-]/g,'');
    name.value=v;
    const invalid = v.trim().length<3; setInvalid(name, invalid);
    showError('name-error', invalid? 'Как на карте' : '');
  });

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const digits = numOnly(card.value);
    const ok = digits.length===16 && luhnOk(digits)
      && mm.value.length===2 && yy.value.length===2
      && cvv.value.length===3 && name.value.trim().length>=3;

    if(!ok){
      card.dispatchEvent(new Event('input'));
      mm.dispatchEvent(new Event('input'));
      yy.dispatchEvent(new Event('input'));
      cvv.dispatchEvent(new Event('input'));
      name.dispatchEvent(new Event('input'));
      return;
    }
    alert('Оплата успешно инициирована');
  });

  // ---------- flip (весь синий блок) ----------
  const plan = qs('.plan-card[data-flip]');
  const planInner = byId('plan-inner');
  if(plan){
    plan.addEventListener('click', (e)=>{
      if(e.target.closest('[data-no-flip]')) return;
      plan.classList.toggle('is-flipped');
    });
    // keyboard a11y
    plan.setAttribute('tabindex','0');
    plan.setAttribute('role','button');
    plan.setAttribute('aria-expanded','false');
    plan.addEventListener('keydown', (e)=>{
      if(e.code==='Space' || e.code==='Enter'){
        e.preventDefault();
        plan.classList.toggle('is-flipped');
      }
    });
    const obs = new MutationObserver(()=>{
      plan.setAttribute('aria-expanded', plan.classList.contains('is-flipped') ? 'true' : 'false');
    });
    obs.observe(plan, { attributes:true, attributeFilter:['class'] });
  }

  // ---------- высота синей карточки = высоте формы (на десктопе) ----------
  const checkout = byId('checkout');
  const mq = window.matchMedia('(min-width: 900px)');

  function syncHeights(){
    if(!mq.matches){
      planInner.style.height = '';
      return;
    }
    if(!checkout || !planInner) return;
    planInner.style.height = '';
    const h = checkout.getBoundingClientRect().height;
    const minH = 420;
    planInner.style.height = Math.max(h, minH) + 'px';
  }

  function rafSync(){ window.requestAnimationFrame(syncHeights); }
  window.addEventListener('resize', rafSync);
  mq.addEventListener ? mq.addEventListener('change', rafSync) : mq.addListener(rafSync);
  if(document.fonts && document.fonts.ready){ document.fonts.ready.then(rafSync); }
  document.addEventListener('DOMContentLoaded', rafSync);
  setTimeout(rafSync, 200);
})();