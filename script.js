const btn = document.getElementById("feito");
const statusTxt = document.getElementById("status");

// Salvar no localStorage se o treino foi feito hoje
function hoje() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}

btn.onclick = () => {
    localStorage.setItem("treino", hoje());
    statusTxt.textContent = "Treino concluído! ✔";
};

// Mostrar status ao abrir o app
if (localStorage.getItem("treino") === hoje()) {
    statusTxt.textContent = "Você já treinou hoje! ✔";
}

// Registrar Service Worker
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
}
