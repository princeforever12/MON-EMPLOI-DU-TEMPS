// Importation des fonctions Firebase nécessaires
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Ta configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDc45__U4Swdnf-k4iqr9ZdPZUFhkL5NPE",
    authDomain: "edt-iter-l2.firebaseapp.com",
    projectId: "edt-iter-l2",
    storageBucket: "edt-iter-l2.firebasestorage.app",
    messagingSenderId: "846836827338",
    appId: "1:846836827338:web:c7ae5d6fca94a4f5e12033"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Variable globale pour stocker les cours
let allCourses = [];

/**
 * Fonction pour charger les cours depuis Firebase
 */
async function loadCoursesFromFirebase() {
    console.log("Chargement des cours depuis Firebase...");
    const querySnapshot = await getDocs(collection(db, "cours"));
    
    allCourses = [];
    querySnapshot.forEach((doc) => {
        allCourses.push(doc.data());
    });

    console.log("Cours chargés :", allCourses);
    
    // Affiche l'emploi du temps
    renderSchedule();
    // Met à jour les filtres dynamiquement !
    updateFiltersFromData();
    // Met à jour le tableau de bord
    updateDashboard();
}

/**
 * * NOUVEAU : Met à jour les menus déroulants (filtres)
 * à partir des données réelles.
 */
function updateFiltersFromData() {
    const teacherSelect = document.getElementById('filter-teacher');
    const subjectSelect = document.getElementById('filter-subject');

    // Sauvegarder la sélection actuelle pour ne pas la perdre
    const currentTeacher = teacherSelect.value;
    const currentSubject = subjectSelect.value;

    // Récupérer tous les profs et codes uniques, triés par ordre alphabétique
    const teachers = [...new Set(allCourses.map(c => c.enseignant).filter(t => t))].sort();
    const subjects = [...new Set(allCourses.map(c => c.code).filter(s => s))].sort();

    // Reconstruire le select Professeurs
    teacherSelect.innerHTML = '<option value="tous">-- Tous les enseignants --</option>';
    teachers.forEach(teacher => {
        const option = document.createElement('option');
        option.value = teacher;
        option.textContent = teacher;
        teacherSelect.appendChild(option);
    });

    // Reconstruire le select Matières
    subjectSelect.innerHTML = '<option value="tous">-- Toutes les matières --</option>';
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectSelect.appendChild(option);
    });

    // Restaurer la sélection si elle existe toujours
    if (teachers.includes(currentTeacher)) teacherSelect.value = currentTeacher;
    if (subjects.includes(currentSubject)) subjectSelect.value = currentSubject;
}


function renderSchedule() {
    const tbodyG1 = document.querySelector('#groupe1 tbody');
    const tbodyG2 = document.querySelector('#groupe2 tbody');
    
    if(tbodyG1) tbodyG1.innerHTML = '';
    if(tbodyG2) tbodyG2.innerHTML = '';

    const days = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const slots = [
        { id: "8", label: "08H-11H" },
        { id: "11", label: "11H-14H" },
        { id: "14", label: "14H-17H" }
    ];

    days.forEach(day => {
        // --- GROUPE 1 ---
        let rowG1 = `<tr><th>${day}</th>`;
        slots.forEach(slot => {
            const cours = allCourses.find(c => c.jour === day && c.heure === slot.label && c.groupe === "Groupe 1");
            if (cours) {
                const dayShort = day.substring(0,3).toLowerCase();
                const slotShort = slot.id;
                const cellId = `g1_${dayShort}_${slotShort}`;
                // On sécurise les données avec || "" pour éviter les "undefined"
                const matiereFull = cours.matiere || "";
                rowG1 += `<td id="${cellId}" class="${cours.classeCouleur}" 
                            data-matiere="${cours.code} - ${matiereFull}" 
                            data-salle="${cours.salle}" 
                            data-enseignant="${cours.enseignant}" 
                            data-horaire="${cours.heure}">
                            ${cours.code}
                          </td>
                          <td>${cours.salle}</td>
                          <td>${cours.enseignant}</td>`;
            } else {
                rowG1 += `<td colspan="3"></td>`;
            }
        });
        rowG1 += `</tr>`;
        if(tbodyG1) tbodyG1.innerHTML += rowG1;

        // --- GROUPE 2 ---
        let rowG2 = `<tr><th>${day}</th>`;
        slots.forEach(slot => {
            const cours = allCourses.find(c => c.jour === day && c.heure === slot.label && c.groupe === "Groupe 2");
            if (cours) {
                const dayShort = day.substring(0,3).toLowerCase();
                const slotShort = slot.id;
                const cellId = `g2_${dayShort}_${slotShort}`;
                const matiereFull = cours.matiere || "";
                rowG2 += `<td id="${cellId}" class="${cours.classeCouleur}" 
                            data-matiere="${cours.code} - ${matiereFull}" 
                            data-salle="${cours.salle}" 
                            data-enseignant="${cours.enseignant}" 
                            data-horaire="${cours.heure}">
                            ${cours.code}
                          </td>
                          <td>${cours.salle}</td>
                          <td>${cours.enseignant}</td>`;
            } else {
                rowG2 += `<td colspan="3"></td>`;
            }
        });
        rowG2 += `</tr>`;
        if(tbodyG2) tbodyG2.innerHTML += rowG2;
    });

    attachModalEvents();
}

// ... Fonctions utilitaires ...

function showTab(tabId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab-button[onclick="showTab('${tabId}')"]`).classList.add('active');
    localStorage.setItem('activeTabId', tabId);
    updateDashboard(); 
}

/**
 * * CORRIGÉ : Tableau de bord complet
 */
function updateDashboard() {
    const now = new Date();
    const dayIndex = now.getDay();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    
    // Formater la date proprement en français (ex: Lundi)
    const jourTexte = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(now);
    // Mettre la première lettre en majuscule
    const jourCapitalized = jourTexte.charAt(0).toUpperCase() + jourTexte.slice(1);
    
    const paddedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const currentTimeString = `${hour}h${paddedMinutes}`;
    
    const messageElement = document.getElementById('dashboard-message');
    // Message de base rétabli
    let welcomeMessage = `Bonjour ! Nous sommes <strong>${jourCapitalized}</strong> et il est <strong>${currentTimeString}</strong>.`;
    
    document.querySelectorAll('.cours-actuel').forEach(c => c.classList.remove('cours-actuel'));

    if (dayIndex === 0) { 
        messageElement.innerHTML = welcomeMessage + "<br><strong>Bon dimanche !</strong> Repos avant la reprise."; 
        return; 
    }
    if (hour < 8) { 
        messageElement.innerHTML = welcomeMessage + "<br>Les cours n'ont pas encore commencé. Reprise à 8h !"; 
        return; 
    }
    if (hour >= 17) { 
        messageElement.innerHTML = welcomeMessage + "<br>Les cours sont terminés pour aujourd'hui. Bonne soirée !"; 
        return; 
    }

    let groupPrefix = 'g1';
    const activeTabButton = document.querySelector('.tab-button.active');
    if (activeTabButton && activeTabButton.getAttribute('onclick').includes('groupe2')) {
        groupPrefix = 'g2';
    }
    
    const idPrefixes = ["", "lun", "mar", "mer", "jeu", "ven", "sam"];
    const dayPrefix = idPrefixes[dayIndex];

    const cell_8h = document.getElementById(`${groupPrefix}_${dayPrefix}_8`);
    const cell_11h = document.getElementById(`${groupPrefix}_${dayPrefix}_11`);
    const cell_14h = document.getElementById(`${groupPrefix}_${dayPrefix}_14`);

    let specificMessage = "";

    if (hour >= 8 && hour < 11) {
        if (cell_8h) { 
            highlightCourse(cell_8h); 
            // On récupère le nom propre du cours depuis le data-attribute
            // On nettoie le nom pour enlever le code s'il est répété
            let nomCours = cell_8h.dataset.matiere;
            specificMessage = `<br>Le cours actuel <strong>${nomCours}</strong> clignote.`; 
        } else { 
            specificMessage = "<br>Heure creuse (pas de cours)."; 
        }
    } else if (hour >= 11 && hour < 14) {
        if (cell_11h) { 
            highlightCourse(cell_11h); 
            let nomCours = cell_11h.dataset.matiere;
            specificMessage = `<br>Le cours actuel <strong>${nomCours}</strong> clignote.`; 
        } else { 
            specificMessage = "<br>Heure creuse (pas de cours)."; 
        }
    } else if (hour >= 14 && hour < 17) {
        if (cell_14h) { 
            highlightCourse(cell_14h); 
            let nomCours = cell_14h.dataset.matiere;
            specificMessage = `<br>Le cours actuel <strong>${nomCours}</strong> clignote.`; 
        } else { 
            specificMessage = "<br>Plus de cours pour ce groupe aujourd'hui."; 
        }
    }
    
    messageElement.innerHTML = welcomeMessage + specificMessage;
}

function highlightCourse(firstCell) {
    let cell = firstCell;
    for(let i=0; i<3; i++) {
        if(cell) {
            cell.classList.add('cours-actuel');
            cell = cell.nextElementSibling;
        }
    }
}

const modalContainer = document.getElementById('modal-container');
function openModal(cellElement) {
    document.getElementById('modal-title').textContent = `Détails du Cours`;
    document.getElementById('modal-matiere').textContent = cellElement.dataset.matiere;
    document.getElementById('modal-code').textContent = cellElement.innerText;
    document.getElementById('modal-enseignant').textContent = cellElement.dataset.enseignant;
    document.getElementById('modal-salle').textContent = cellElement.dataset.salle;
    document.getElementById('modal-horaire').textContent = cellElement.dataset.horaire;
    modalContainer.style.display = 'flex';
}
function closeModal() { modalContainer.style.display = 'none'; }

function attachModalEvents() {
    document.querySelectorAll('td[data-matiere]').forEach(cell => {
        cell.onclick = () => openModal(cell);
    });
}

// Filtres
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
    const savedTabId = localStorage.getItem('activeTabId');
    if (savedTabId) showTab(savedTabId); 
    else showTab('groupe1');

    // Initialisation des écouteurs (même si les options sont vides au début)
    document.getElementById('filter-teacher').addEventListener('change', applyFilters);
    document.getElementById('filter-subject').addEventListener('change', applyFilters);
    document.getElementById('reset-filters').addEventListener('click', () => {
        document.getElementById('filter-teacher').value = 'tous';
        document.getElementById('filter-subject').value = 'tous';
        applyFilters();
    });

    setInterval(updateDashboard, 60000);
    loadCoursesFromFirebase();

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/MON-EMPLOI-DU-TEMPS/sw.js'); 
        });
    }
});

// Exposer les fonctions au HTML
window.showTab = showTab;
window.closeModal = closeModal;

export { db };