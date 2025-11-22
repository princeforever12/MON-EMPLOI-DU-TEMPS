import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// On ajoute un paramètre de version pour éviter le cache du navigateur
import { GoogleGenerativeAI } from "https://esm.run/@google/generative-ai?v=1";

const firebaseConfig = {
    apiKey: "AIzaSyDc45__U4Swdnf-k4iqr9ZdPZUFhkL5NPE",
    authDomain: "edt-iter-l2.firebaseapp.com",
    projectId: "edt-iter-l2",
    storageBucket: "edt-iter-l2.firebasestorage.app",
    messagingSenderId: "846836827338",
    appId: "1:846836827338:web:c7ae5d6fca94a4f5e12033"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- CONFIGURATION IA ---
// Ta clé API (La dernière que tu as envoyée)
const apiKey = "AIzaSyAE6yJyjRc21wGYOSx8ylALkaHsUOXjIzY"; 
const genAI = new GoogleGenerativeAI(apiKey);

let allCourses = [];
let currentLevel = localStorage.getItem('userLevel');

window.selectLevel = function(level) {
    currentLevel = level;
    localStorage.setItem('userLevel', level);
    applyLevelUI();
    loadCoursesFromFirebase();
};

window.resetLevel = function() {
    localStorage.removeItem('userLevel');
    localStorage.removeItem('activeTabId');
    location.reload();
};

function applyLevelUI() {
    document.getElementById('level-selector').classList.add('hidden');
    document.getElementById('app-content').classList.remove('hidden');
    
    const title = document.getElementById('main-title');
    const t1 = document.getElementById('title-g1');
    const t2 = document.getElementById('title-g2');
    const t3 = document.getElementById('title-g3');

    if (currentLevel === 'L3') {
        title.innerText = "Emploi du Temps L3 ITER";
        document.getElementById('tab-g1').innerText = "Informatique"; t1.innerText = "PARCOURS INFORMATIQUE";
        document.getElementById('tab-g2').innerText = "IMT"; t2.innerText = "PARCOURS IMT";
        document.getElementById('tab-g3').innerText = "EEA"; t3.innerText = "PARCOURS EEA";
        document.getElementById('tab-g3').style.display = 'inline-block';
    } else {
        title.innerText = `Emploi du Temps ${currentLevel} ITER`;
        document.getElementById('tab-g1').innerText = "Groupe 1"; t1.innerText = "GROUPE 1";
        document.getElementById('tab-g2').innerText = "Groupe 2"; t2.innerText = "GROUPE 2";
        document.getElementById('tab-g3').style.display = 'none';
    }
}

async function loadCoursesFromFirebase() {
    console.log(`Chargement des cours pour ${currentLevel}...`);
    const querySnapshot = await getDocs(collection(db, "cours"));
    allCourses = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.niveau === currentLevel) allCourses.push(data);
    });
    renderSchedule();
    updateFiltersFromData();
    updateDashboard();
}

function updateFiltersFromData() {
    const teacherSelect = document.getElementById('filter-teacher');
    const subjectSelect = document.getElementById('filter-subject');
    const currentTeacher = localStorage.getItem('savedTeacherFilter') || 'tous';
    const currentSubject = localStorage.getItem('savedSubjectFilter') || 'tous';

    const teachers = [...new Set(allCourses.map(c => c.enseignant).filter(t => t))].sort();
    const subjects = [...new Set(allCourses.map(c => c.code).filter(s => s))].sort();

    teacherSelect.innerHTML = '<option value="tous">-- Tous --</option>';
    teachers.forEach(t => teacherSelect.innerHTML += `<option value="${t}">${t}</option>`);
    subjectSelect.innerHTML = '<option value="tous">-- Toutes --</option>';
    subjects.forEach(s => subjectSelect.innerHTML += `<option value="${s}">${s}</option>`);

    if ([...teacherSelect.options].some(o => o.value === currentTeacher)) teacherSelect.value = currentTeacher;
    if ([...subjectSelect.options].some(o => o.value === currentSubject)) subjectSelect.value = currentSubject;
    applyFilters();
}

function renderSchedule() {
    const bodies = {
        'Groupe 1': document.querySelector('#groupe1 tbody'),
        'Groupe 2': document.querySelector('#groupe2 tbody'),
        'Groupe 3': document.querySelector('#groupe3 tbody')
    };
    Object.values(bodies).forEach(b => { if(b) b.innerHTML = ''; });

    const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const slots = [{ id: "8", label: "08H-11H" }, { id: "11", label: "11H-14H" }, { id: "14", label: "14H-17H" }];

    days.forEach(day => {
        ['Groupe 1', 'Groupe 2', 'Groupe 3'].forEach(grpName => {
            if (currentLevel !== 'L3' && grpName === 'Groupe 3') return;
            if (!bodies[grpName]) return;

            let row = `<tr><th>${day}</th>`;
            slots.forEach(slot => {
                const cours = allCourses.find(c => c.jour === day && c.heure === slot.label && c.groupe === grpName);
                if (cours) {
                    const cellId = `${grpName.replace(' ', '').toLowerCase()}_${day.substring(0,3).toLowerCase()}_${slot.id}`;
                    const nomComplet = cours.matiere || "";
                    const dataAttrs = `class="clickable-cell" data-matiere="${cours.code} - ${nomComplet}" data-code="${cours.code}" data-salle="${cours.salle}" data-enseignant="${cours.enseignant}" data-horaire="${cours.heure}"`;

                    row += `<td id="${cellId}" class="${cours.classeCouleur} clickable-cell" ${dataAttrs}>${cours.code}</td>
                            <td class="clickable-cell" ${dataAttrs}>${cours.salle}</td>
                            <td class="clickable-cell" ${dataAttrs}>${cours.enseignant}</td>`;
                } else {
                    row += `<td colspan="3"></td>`;
                }
            });
            row += `</tr>`;
            bodies[grpName].innerHTML += row;
        });
    });
    attachModalEvents();
}

// --- FONCTION IA INTELLIGENTE (Multi-Modèles) ---
// Cette fonction essaie plusieurs modèles jusqu'à ce que ça marche.
async function tryGenerateContent(prompt) {
    const modelsToTry = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"];
    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`Essai avec le modèle : ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text(); // Succès !
        } catch (error) {
            console.warn(`Échec avec ${modelName}:`, error);
            lastError = error;
            // On continue avec le prochain modèle
        }
    }
    throw lastError; // Si tous échouent
}

window.askGemini = async function(type) {
    const matiere = document.getElementById('modal-matiere').innerText;
    const code = document.getElementById('modal-code').innerText;
    
    const aiResponseDiv = document.getElementById('ai-response');
    aiResponseDiv.style.display = 'block';
    aiResponseDiv.innerHTML = '✨ <em>L\'IA réfléchit... (Tentative de connexion)</em>';
    
    let prompt = "";
    if (type === 'quiz') prompt = `Agis comme un professeur expert en "${matiere}" (${code}). Génère un quiz court de 3 questions à choix multiples (QCM). Affiche la réponse correcte à la fin. Formatte en HTML simple (<b>, <ul>). Réponds en français.`;
    else if (type === 'summary') prompt = `Donne-moi un résumé concis des 5 concepts clés pour le cours de "${matiere}" (${code}). Formatte en HTML simple. Réponds en français.`;
    else if (type === 'tips') prompt = `Donne-moi 3 conseils de révision pour l'examen de "${matiere}". Formatte en HTML simple. Réponds en français.`;

    try {
        const text = await tryGenerateContent(prompt);
        aiResponseDiv.innerHTML = `<h4>✨ Réponse du Coach IA :</h4>${text}`;
    } catch (error) {
        console.error("Tous les modèles ont échoué:", error);
        aiResponseDiv.innerHTML = `<p style="color:red">L'IA ne répond pas. Vérifie ta connexion internet et que ta clé API est bien active sur Google AI Studio.</p>`;
    }
};

function showTab(tabId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    const btn = document.querySelector(`.tab-button[onclick="showTab('${tabId}')"]`);
    if(btn) btn.classList.add('active');
    localStorage.setItem('activeTabId', tabId);
    updateDashboard(); 
}

function updateDashboard() {
    const now = new Date();
    const dayIndex = now.getDay();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const jourTexte = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(now);
    const jourCapitalized = jourTexte.charAt(0).toUpperCase() + jourTexte.slice(1);
    const paddedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const currentTimeString = `${hour}h${paddedMinutes}`;
    const messageElement = document.getElementById('dashboard-message');
    let welcomeMessage = `Bonjour ! Nous sommes <strong>${jourCapitalized}</strong> et il est <strong>${currentTimeString}</strong>.`;
    
    document.querySelectorAll('.cours-actuel').forEach(c => c.classList.remove('cours-actuel'));

    if (dayIndex === 0) { messageElement.innerHTML = welcomeMessage + "<br><strong>Bon dimanche !</strong> Repos avant la reprise."; return; }
    if (hour < 8) { messageElement.innerHTML = welcomeMessage + "<br>Les cours n'ont pas encore commencé. Reprise à 8h !"; return; }
    if (hour >= 17) { messageElement.innerHTML = welcomeMessage + "<br>Les cours sont terminés pour aujourd'hui. Bonne soirée !"; return; }

    let groupPrefix = 'groupe1';
    const activeSection = document.querySelector('.content-section.active');
    if (activeSection) groupPrefix = activeSection.id;
    const idPrefixes = ["", "lun", "mar", "mer", "jeu", "ven", "sam"];
    const dayPrefix = idPrefixes[dayIndex];
    const cell_8h = document.getElementById(`${groupPrefix}_${dayPrefix}_8`);
    const cell_11h = document.getElementById(`${groupPrefix}_${dayPrefix}_11`);
    const cell_14h = document.getElementById(`${groupPrefix}_${dayPrefix}_14`);

    let specificMessage = "";
    const highlightRow = (firstCell) => {
        let cell = firstCell;
        for(let i=0; i<3; i++) { if(cell) { cell.classList.add('cours-actuel'); cell = cell.nextElementSibling; } }
    };

    if (hour >= 8 && hour < 11) {
        if (cell_8h && cell_8h.dataset.code) { highlightRow(cell_8h); specificMessage = `<br>Le cours actuel <strong>${cell_8h.dataset.code}</strong> clignote.`; } 
        else { specificMessage = "<br>Heure creuse (pas de cours)."; }
    } else if (hour >= 11 && hour < 14) {
        if (cell_11h && cell_11h.dataset.code) { highlightRow(cell_11h); specificMessage = `<br>Le cours actuel <strong>${cell_11h.dataset.code}</strong> clignote.`; } 
        else { specificMessage = "<br>Heure creuse (pas de cours)."; }
    } else if (hour >= 14 && hour < 17) {
        if (cell_14h && cell_14h.dataset.code) { highlightRow(cell_14h); specificMessage = `<br>Le cours actuel <strong>${cell_14h.dataset.code}</strong> clignote.`; } 
        else { specificMessage = "<br>Plus de cours pour ce groupe aujourd'hui."; }
    }
    messageElement.innerHTML = welcomeMessage + specificMessage;
}

window.closeModal = function() { 
    document.getElementById('modal-container').style.display = 'none'; 
    document.getElementById('ai-response').style.display = 'none';
    document.getElementById('ai-response').innerHTML = '';
}

function attachModalEvents() {
    document.querySelectorAll('.clickable-cell').forEach(cell => {
        cell.onclick = () => {
            document.getElementById('modal-matiere').innerText = cell.dataset.matiere;
            document.getElementById('modal-code').innerText = cell.dataset.code || "";
            document.getElementById('modal-enseignant').innerText = cell.dataset.enseignant;
            document.getElementById('modal-salle').innerText = cell.dataset.salle;
            document.getElementById('modal-horaire').innerText = cell.dataset.horaire;
            document.getElementById('ai-response').innerHTML = "";
            document.getElementById('ai-response').style.display = "none";
            document.getElementById('modal-container').style.display = 'flex';
        };
    });
}

function applyFilters() {
    const teacherFilter = document.getElementById('filter-teacher').value;
    const subjectFilter = document.getElementById('filter-subject').value;
    localStorage.setItem('savedTeacherFilter', teacherFilter);
    localStorage.setItem('savedSubjectFilter', subjectFilter);
    const rows = document.querySelectorAll('.schedule-table tbody tr');
    rows.forEach(row => {
        let teacherMatch = (teacherFilter === 'tous');
        if (!teacherMatch && row.innerText.includes(teacherFilter)) teacherMatch = true;
        let subjectMatch = (subjectFilter === 'tous');
        if (!subjectMatch && row.innerText.includes(subjectFilter)) subjectMatch = true;
        if (teacherMatch && subjectMatch) row.classList.remove('row-hidden');
        else row.classList.add('row-hidden');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (currentLevel) {
        applyLevelUI();
        loadCoursesFromFirebase();
        const savedTabId = localStorage.getItem('activeTabId');
        if (savedTabId) setTimeout(() => showTab(savedTabId), 100);
        else showTab('groupe1');
    }
    document.getElementById('filter-teacher').addEventListener('change', applyFilters);
    document.getElementById('filter-subject').addEventListener('change', applyFilters);
    document.getElementById('reset-filters').addEventListener('click', () => {
        document.getElementById('filter-teacher').value = 'tous';
        document.getElementById('filter-subject').value = 'tous';
        applyFilters();
    });
    setInterval(updateDashboard, 60000);
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('/MON-EMPLOI-DU-TEMPS/sw.js'); });
}

window.showTab = showTab;
window.closeModal = closeModal;
export { db };