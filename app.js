
// app.js - Treino Diário (PWA full)
// Persistência: localStorage
// Notificações: Notification API (verifica às 16:00 local)
// Instalação: mostra botão usando beforeinstallprompt

(function(){
  // default plan (same as earlier)
  const defaultPlan = {
    Monday: [
      { id: "m-cardio", label: "50 polichinelos" },
      { id: "m-squats", label: "20 agachamentos" },
      { id: "m-push", label: "15 flexões (joelho opcional)" },
      { id: "m-plank", label: "Prancha 30s" }
    ],
    Tuesday: [
      { id: "t-ab1", label: "20 abdominais tradicionais" },
      { id: "t-bike", label: "20 abdominal bicicleta" },
      { id: "t-knife", label: "15 canivete (ou 10 se precisar)" },
      { id: "t-plank", label: "Prancha 30-40s" }
    ],
    Wednesday: [
      { id: "w-squats", label: "25 agachamentos" },
      { id: "w-lunge", label: "20 avanços (10 cada perna)" },
      { id: "w-wall", label: "Cadeira invisível 25-30s" },
      { id: "w-jumps", label: "15 saltos com agachamento (ou 10)" }
    ],
    Thursday: [
      { id: "th-cardio1", label: "40 polichinelos" },
      { id: "th-highknees", label: "20 corrida com joelhos altos" },
      { id: "th-cardio2", label: "20 polichinelos" },
      { id: "th-plank", label: "Prancha 20-30s" }
    ],
    Friday: [
      { id: "f-ab1", label: "20 abdominais" },
      { id: "f-oblique", label: "20 abdominais oblíquos (10 cada lado)" },
      { id: "f-plank", label: "Prancha 30s" },
      { id: "f-legraise", label: "20 leg raise (perna elevada)" }
    ],
    Saturday: [
      { id: "s-squats", label: "20 agachamentos" },
      { id: "s-push", label: "15 flexões" },
      { id: "s-ab", label: "20 abdominais" },
      { id: "s-cardio", label: "30 polichinelos" }
    ],
    Sunday: [
      { id: "sun-rest", label: "Descanso ativo - caminhar 15-20 min" }
    ]
  };

  // state
  const STORAGE_PLAN_KEY = 'fit_plan_v1';
  const STORAGE_DONE_KEY = 'fit_done_v1';
  const STORAGE_TIME_KEY = 'fit_starttime_v1';

  function loadPlan(){
    const raw = localStorage.getItem(STORAGE_PLAN_KEY);
    return raw ? JSON.parse(raw) : defaultPlan;
  }
  function savePlan(p){ localStorage.setItem(STORAGE_PLAN_KEY, JSON.stringify(p)); }

  let plan = loadPlan();
  let done = JSON.parse(localStorage.getItem(STORAGE_DONE_KEY) || '{}');
  const startTime = localStorage.getItem(STORAGE_TIME_KEY) || '16:00';

  // DOM
  const todayNameEl = document.getElementById('todayName');
  const todayListEl = document.getElementById('todayList');
  const markAllBtn = document.getElementById('markAll');
  const clearAllBtn = document.getElementById('clearAll');
  const countdownEl = document.getElementById('countdown');
  const installBtn = document.getElementById('installBtn');

  const navBtns = document.querySelectorAll('.nav-btn');

  function getTodayName(date=new Date()){
    const names = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    return names[date.getDay()];
  }
  function getDisplayName(day){
    const map = { Monday:'Segunda', Tuesday:'Terça', Wednesday:'Quarta', Thursday:'Quinta', Friday:'Sexta', Saturday:'Sábado', Sunday:'Domingo' };
    return map[day] || day;
  }

  let currentDay = getTodayName();
  function renderDay(day){
    currentDay = day;
    todayNameEl.textContent = getDisplayName(day);
    todayListEl.innerHTML = '';
    const items = plan[day] || [];
    items.forEach(it=>{
      const li = document.createElement('li');
      li.className = 'exercise-item';
      const chk = document.createElement('button');
      chk.className = 'checkbox';
      if(done[it.id]) chk.classList.add('checked');
      chk.addEventListener('click', ()=>{
        done[it.id] = !done[it.id];
        if(done[it.id]) chk.classList.add('checked'); else chk.classList.remove('checked');
        localStorage.setItem(STORAGE_DONE_KEY, JSON.stringify(done));
      });
      const label = document.createElement('div');
      label.className = 'label';
      label.textContent = it.label;
      li.appendChild(chk);
      li.appendChild(label);
      todayListEl.appendChild(li);
    });

    // mark active nav
    navBtns.forEach(b=>b.classList.toggle('active', b.dataset.day===day));
  }

  navBtns.forEach(b=>{
    b.addEventListener('click', ()=> renderDay(b.dataset.day));
  });

  markAllBtn.addEventListener('click', ()=>{
    const items = plan[currentDay] || [];
    items.forEach(it=> done[it.id]=true);
    localStorage.setItem(STORAGE_DONE_KEY, JSON.stringify(done));
    renderDay(currentDay);
  });

  clearAllBtn.addEventListener('click', ()=>{
    const items = plan[currentDay] || [];
    items.forEach(it=> delete done[it.id]);
    localStorage.setItem(STORAGE_DONE_KEY, JSON.stringify(done));
    renderDay(currentDay);
  });

  // countdown to next 16:00
  function updateCountdown(){
    const now = new Date();
    const [hh, mm] = startTime.split(':').map(Number);
    const target = new Date(now);
    target.setHours(hh, mm, 0, 0);
    if(target <= now) target.setDate(target.getDate()+1);
    const diff = target - now;
    const m = Math.floor(diff/60000), s = Math.floor((diff%60000)/1000);
    countdownEl.textContent = `${m}m ${s}s`;
  }
  setInterval(updateCountdown,1000);
  updateCountdown();

  // notification at startTime (fires once per day)
  function scheduleCheckNotification(){
    setInterval(()=>{
      const now = new Date();
      const [hh, mm] = startTime.split(':').map(Number);
      if(now.getHours() === hh && now.getMinutes() === mm){
        const key = 'notified-'+now.getFullYear()+'-'+(now.getMonth()+1)+'-'+now.getDate();
        if(!localStorage.getItem(key)){
          showNotification();
          localStorage.setItem(key,'1');
        }
      }
    }, 1000*20);
  }

  function showNotification(){
    if('Notification' in window && Notification.permission==='granted'){
      new Notification('Hora do treino — 16:00', { body: 'Abra o Fit Diário e faça seu treino do dia!' });
    } else if('Notification' in window && Notification.permission !== 'denied'){
      Notification.requestPermission().then(p=>{
        if(p==='granted') new Notification('Hora do treino — 16:00', { body: 'Abra o Fit Diário e faça seu treino do dia!' });
      });
    }
  }

  // handle PWA install prompt
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e)=>{
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false;
  });
  installBtn.addEventListener('click', async ()=>{
    if(!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if(choice.outcome === 'accepted') installBtn.hidden = true;
    deferredPrompt = null;
  });

  // initial render
  todayNameEl.textContent = getDisplayName(currentDay);
  renderDay(currentDay);
  updateCountdown();
  scheduleCheckNotification();

  // ask for notification permission politely
  setTimeout(()=>{ if('Notification' in window && Notification.permission==='default'){ Notification.requestPermission(); } }, 3000);

  // expose for console debug
  window.FitApp = { plan, renderDay, showNotification, getTodayName };
})();
