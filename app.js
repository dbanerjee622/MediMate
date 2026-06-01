let medications = JSON.parse(localStorage.getItem("medications")) || [];
let moodLogs = JSON.parse(localStorage.getItem("moodLogs")) || [];
let selectedMood = null;

// --- INITIALIZATION ---
function init() {
    // Greeting
    const hr = new Date().getHours();
    document.getElementById("smartGreeting").textContent = hr < 12 ? "Good Morning ☀️" : hr < 18 ? "Good Afternoon 🌤️" : "Good Evening 🌙";
    
    // Theme Sync
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        document.getElementById("themeIcon").textContent = "☀️";
    }

    // Daily Reset
    const today = new Date().toLocaleDateString();
    if (localStorage.getItem('lastResetDate') !== today) {
        medications = medications.map(m => ({ ...m, taken: false }));
        saveData();
        localStorage.setItem('lastResetDate', today);
    }
    renderSchedule();
}

const saveData = () => localStorage.setItem("medications", JSON.stringify(medications));

// --- THEME TOGGLE ---
document.getElementById("themeToggle").onclick = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.theme = isDark ? 'dark' : 'light';
    document.getElementById("themeToggle").textContent = isDark ? "☀️" : "🌙";
};

// --- IMAGE PROCESSING ---
async function processImage(file) {
    if (!file) return "";
    return new Promise((res) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result);
        reader.readAsDataURL(file);
    });
}

// --- RENDER LIST ---
function renderSchedule() {
    const list = document.getElementById("scheduleList");
    list.innerHTML = medications.length === 0 ? `<p class="text-center text-slate-400 py-10 font-bold">No medications yet.</p>` : "";
    
    medications.sort((a, b) => a.time.localeCompare(b.time));

    medications.forEach(med => {
        const card = document.createElement("div");
        card.className = `p-5 rounded-2xl border-2 flex items-center justify-between ${med.taken ? 'bg-slate-50 dark:bg-slate-800 border-transparent opacity-60' : 'bg-white dark:bg-slate-800 border-teal-50 dark:border-teal-900 shadow-sm'}`;
        card.innerHTML = `
            <div class="flex items-center gap-4">
                ${med.photo ? `<img src="${med.photo}" class="w-14 h-14 rounded-xl object-cover border-2 border-primary">` : '<div class="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-2xl">💊</div>'}
                <div class="${med.taken ? 'taken' : ''}">
                    <p class="text-xs font-black text-primary uppercase">${med.time}</p>
                    <h3 class="text-xl font-bold">${med.name}</h3>
                    <p class="text-sm opacity-70">${med.dosage}</p>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="toggleTaken(${med.id})" class="px-5 py-2 rounded-xl font-bold ${med.taken ? 'bg-slate-200 dark:bg-slate-700 text-slate-600' : 'bg-primary text-white shadow-md'}">${med.taken ? 'Undo' : 'Done'}</button>
                <button onclick="deleteMed(${med.id})" class="text-red-400 px-2 font-black">✕</button>
            </div>`;
        list.appendChild(card);
    });
}

window.toggleTaken = (id) => {
    medications = medications.map(m => m.id === id ? {...m, taken: !m.taken} : m);
    saveData(); renderSchedule();
};

window.deleteMed = (id) => {
    if (confirm("Delete this?")) {
        medications = medications.filter(m => m.id !== id);
        saveData(); renderSchedule();
    }
};

// --- FORM SUBMIT ---
document.getElementById("medicationForm").onsubmit = async (e) => {
    e.preventDefault();
    const photoFile = document.getElementById("medPhoto").files[0];
    const photoData = await processImage(photoFile);

    medications.push({
        id: Date.now(),
        name: document.getElementById("medName").value,
        dosage: document.getElementById("dosage").value,
        time: document.getElementById("time").value,
        photo: photoData,
        taken: false
    });

    saveData(); renderSchedule();
    e.target.reset();
};

// --- MOOD & NOTIFICATIONS (Existing Logic) ---
document.querySelectorAll(".mood-btn").forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll(".mood-btn").forEach(b => b.classList.remove("mood-selected"));
        btn.classList.add("mood-selected");
        selectedMood = btn.dataset.value;
    };
});

document.getElementById("saveMood").onclick = () => {
    if (!selectedMood) return alert("Select mood");
    moodLogs.push({ date: new Date().toLocaleDateString(), mood: selectedMood, notes: document.getElementById("moodNotes").value });
    localStorage.setItem("moodLogs", JSON.stringify(moodLogs));
    alert("Saved!");
};

document.getElementById("enableNotifications").onclick = () => Notification.requestPermission();

setInterval(() => {
    if (Notification.permission !== "granted") return;
    const now = `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}`;
    medications.forEach(m => {
        if (m.time === now && !m.taken) new Notification("Medication Time!", { body: `${m.name} (${m.dosage})` });
    });
}, 60000);

// --- PDF REPORT ---
document.getElementById("generatePdf").onclick = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFillColor(13, 148, 136); doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("MediMate Report", 20, 25);
    doc.setTextColor(40, 40, 40); doc.setFontSize(12);
    let y = 50; doc.text("Medication History:", 20, y);
    medications.forEach(m => { y += 10; doc.text(`${m.taken ? '[X]' : '[ ]'} ${m.time} - ${m.name}`, 25, y); });
    doc.save("MediMate_Report.pdf");
};

init();
