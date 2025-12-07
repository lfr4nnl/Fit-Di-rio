import React, { useEffect, useState } from "react";

// TreinoDiarioApp.jsx
// Single-file React component. Tailwind CSS assumed available in the host project.
// Uses localStorage for persistence and the Web Notification API for reminders.

export default function TreinoDiarioApp() {
  const defaultPlan = {
    Monday: [
      { id: "m-warmup", label: "Aquecimento - 1 min", details: "30s corrida parada + 30s polichinelos" },
      { id: "m-cardio1", label: "50 polichinelos" },
      { id: "m-squats", label: "20 agachamentos" },
      { id: "m-cardio2", label: "30 polichinelos" },
      { id: "m-push", label: "15 flexões (joelho opcional)" },
      { id: "m-plank", label: "Prancha 30s" }
    ],
    Tuesday: [
      { id: "t-warmup", label: "Aquecimento - 1 min", details: "30s polichinelos + 30s elevação de joelhos" },
      { id: "t-ab1", label: "20 abdominais tradicionais" },
      { id: "t-bike", label: "20 abdominal bicicleta" },
      { id: "t-knife", label: "15 canivete (ou 10 se precisar)" },
      { id: "t-plank", label: "Prancha 30-40s" }
    ],
    Wednesday: [
      { id: "w-warmup", label: "Aquecimento - 1 min" },
      { id: "w-squats", label: "25 agachamentos" },
      { id: "w-lunge", label: "20 avanços (10 cada perna)" },
      { id: "w-wall", label: "Cadeira invisível 25-30s" },
      { id: "w-jumps", label: "15 saltos com agachamento (ou 10)" }
    ],
    Thursday: [
      { id: "th-warmup", label: "Aquecimento - 1 min" },
      { id: "th-cardio1", label: "40 polichinelos" },
      { id: "th-highknees", label: "20 corrida com joelhos altos" },
      { id: "th-cardio2", label: "20 polichinelos" },
      { id: "th-buttkick", label: "20 corrida batendo calcanhar no bumbum" },
      { id: "th-plank", label: "Prancha 20-30s" }
    ],
    Friday: [
      { id: "f-warmup", label: "Aquecimento - 1 min" },
      { id: "f-ab1", label: "20 abdominais" },
      { id: "f-oblique", label: "20 abdominais oblíquos (10 cada lado)" },
      { id: "f-plank", label: "Prancha 30s" },
      { id: "f-legraise", label: "20 leg raise (perna elevada)" }
    ],
    Saturday: [
      { id: "s-warmup", label: "Aquecimento - 1 min" },
      { id: "s-squats", label: "20 agachamentos" },
      { id: "s-push", label: "15 flexões" },
      { id: "s-ab", label: "20 abdominais" },
      { id: "s-cardio", label: "30 polichinelos" },
      { id: "s-plank", label: "Prancha 30s" }
    ],
    Sunday: [
      { id: "sun-rest", label: "Descanso ativo", details: "Caminhar 15-20 min ou alongamento" }
    ]
  };

  // default start time fixed to 16:00
  const defaultStartTime = "16:00";

  const [plan, setPlan] = useState(() => {
    const raw = localStorage.getItem("treino-plan-v1");
    return raw ? JSON.parse(raw) : defaultPlan;
  });

  const [completed, setCompleted] = useState(() => {
    const raw = localStorage.getItem("treino-completed-v1");
    return raw ? JSON.parse(raw) : {};
  });

  const [selectedDay, setSelectedDay] = useState(getTodayName());
  const [startTime, setStartTime] = useState(() => {
    return localStorage.getItem("treino-starttime-v1") || defaultStartTime;
  });

  useEffect(() => {
    localStorage.setItem("treino-plan-v1", JSON.stringify(plan));
  }, [plan]);

  useEffect(() => {
    localStorage.setItem("treino-completed-v1", JSON.stringify(completed));
  }, [completed]);

  useEffect(() => {
    localStorage.setItem("treino-starttime-v1", startTime);
  }, [startTime]);

  useEffect(() => {
    // Request notification permission once
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    // check every minute to fire a reminder at the start time for today
    const t = setInterval(() => {
      const now = new Date();
      const [hh, mm] = startTime.split(":" ).map(Number);
      if (now.getHours() === hh && now.getMinutes() === mm) {
        // Only notify once per day: check a flag in localStorage
        const key = `notified-${formatDate(now)}`;
        if (!localStorage.getItem(key)) {
          notifyAtTime();
          localStorage.setItem(key, "1");
        }
      }
    }, 1000 * 30);
    return () => clearInterval(t);
  }, [startTime]);

  function formatDate(d) {
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
  }

  function notifyAtTime() {
    const title = "Hora do treino — 16:00";
    const body = `Vamos treinar! Abra o app e comece o treino do dia (\\nDia: ${getTodayName()}).`;
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    } else if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission().then(p => {
        if (p === "granted") new Notification(title, { body });
      });
    } else {
      // fallback: simple alert
      try { alert("Hora do treino! Abra o app e comece o treino do dia."); } catch(e){}
    }
  }

  function toggleCompleted(itemId) {
    setCompleted(prev => {
      const copy = { ...prev };
      copy[itemId] = !copy[itemId];
      return copy;
    });
  }

  function markAllDayDone(day) {
    const items = plan[day] || [];
    setCompleted(prev => {
      const copy = { ...prev };
      items.forEach(i => (copy[i.id] = true));
      return copy;
    });
  }

  function clearDay(day) {
    const items = plan[day] || [];
    setCompleted(prev => {
      const copy = { ...prev };
      items.forEach(i => delete copy[i.id]);
      return copy;
    });
  }

  function editItemLabel(day, itemId, newLabel) {
    setPlan(prev => {
      const copy = { ...prev };
      copy[day] = copy[day].map(it => (it.id === itemId ? { ...it, label: newLabel } : it));
      return copy;
    });
  }

  function downloadPlan() {
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "treino-plan.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function getTodayName(d = new Date()) {
    const names = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    return names[d.getDay()];
  }

  function nextStartCountdown() {
    const now = new Date();
    const [hh, mm] = startTime.split(":" ).map(Number);
    const target = new Date(now);
    target.setHours(hh, mm, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const diff = Math.max(0, target - now);
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${mins}m ${secs}s`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 font-sans">
      <div className="max-w-3xl mx-auto bg-white shadow-2xl rounded-2xl p-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Treino Diário — 16:00</h1>
            <p className="text-sm text-slate-500">Plano 7 dias — Comece sempre às <strong>{startTime}</strong></p>
            <p className="text-xs text-slate-400 mt-1">Contagem para o próximo treino: {nextStartCountdown()}</p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              className="px-3 py-2 rounded-xl bg-indigo-600 text-white text-sm shadow"
              onClick={() => notifyAtTime()}
            >
              Lembrar agora
            </button>
            <button
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm"
              onClick={() => downloadPlan()}
            >
              Exportar plano
            </button>
          </div>
        </header>

        <main className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <aside className="col-span-1">
            <div className="bg-slate-50 rounded-xl p-4 shadow-inner">
              <h2 className="font-semibold">Dias</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {Object.keys(plan).map(day => (
                  <li key={day}>
                    <button
                      className={`w-full text-left px-3 py-2 rounded-lg ${selectedDay === day ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-100'}`}
                      onClick={() => setSelectedDay(day)}
                      >
                        <div className="flex justify-between">
                          <span>{day}</span>
                          <span className="text-xs text-slate-400">{(plan[day] || []).length} items</span>
                        </div>
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-4 text-xs text-slate-500">
                <p><strong>Lembrete:</strong> O horário padrão de início é <strong>16:00</strong>. Você pode alterar abaixo (salva em seu navegador).</p>
                <div className="mt-2 flex gap-2">
                  <input value={startTime} onChange={(e)=>setStartTime(e.target.value)} className="px-2 py-1 rounded border text-sm" />
                  <button className="px-2 py-1 rounded bg-slate-200 text-sm" onClick={()=>{localStorage.removeItem('notified-'+formatDate(new Date())); alert('Flag de notificação resetada para hoje.')}}>Reset notificação</button>
                </div>
Continue...
              </div>

            </div>

            <div className="mt-4 bg-slate-50 rounded-xl p-4">
              <h3 className="font-semibold text-sm">Ações rápidas</h3>
              <div className="mt-3 flex flex-col gap-2">
                <button className="px-3 py-2 rounded-lg bg-green-600 text-white text-sm" onClick={()=>markAllDayDone(selectedDay)}>Marcar tudo do dia como feito</button>
                <button className="px-3 py-2 rounded-lg border text-sm" onClick={()=>clearDay(selectedDay)}>Limpar marcações do dia</button>
              </div>
            </div>

          </aside>

          <section className="col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{selectedDay}</h2>
              <div className="text-sm text-slate-500">Começa às <strong>{startTime}</strong></div>
            </div>

            <div className="mt-4 space-y-3">
              {(plan[selectedDay] || []).map(item => (
                <div key={item.id} className="flex items-start gap-3 bg-white border rounded-xl p-3 shadow-sm">
                  <input type="checkbox" checked={!!completed[item.id]} onChange={()=>toggleCompleted(item.id)} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className={`font-medium ${completed[item.id] ? 'line-through text-slate-400' : ''}`}>{item.label}</div>
                        {item.details && <div className="text-xs text-slate-400 mt-1">{item.details}</div>}
                      </div>
                      <div className="flex gap-2">
                        <button className="text-xs px-2 py-1 border rounded" onClick={()=>{
                          const newLabel = prompt('Editar descrição', item.label);
                          if(newLabel) editItemLabel(selectedDay, item.id, newLabel);
                        }}>Editar</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {(plan[selectedDay] || []).length === 0 && (
                <div className="text-slate-400">Sem itens neste dia.</div>
              )}

            </div>

            <div className="mt-6 flex gap-3">
              <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white" onClick={()=>{navigator.clipboard && navigator.clipboard.writeText(JSON.stringify(plan[selectedDay] || [], null, 2)); alert('Plano do dia copiado para a área de transferência');}}>Copiar plano do dia</button>
              <button className="px-4 py-2 rounded-xl border" onClick={()=>{const file = new Blob([JSON.stringify(plan[selectedDay] || [], null, 2)], {type:'application/json'}); const u = URL.createObjectURL(file); const a = document.createElement('a'); a.href = u; a.download = `${selectedDay}-treino.json`; a.click(); URL.revokeObjectURL(u);}}>Exportar dia</button>
            </div>

          </section>
        </main>

        <footer className="mt-6 text-xs text-slate-500">
          <div>Feito para uso pessoal. Use com segurança — se sentir dor, pare e procure ajuda de um profissional.</div>
        </footer>
      </div>
    </div>
  );
}
