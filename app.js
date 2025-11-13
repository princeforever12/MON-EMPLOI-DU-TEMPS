/* Dictionnaire des matières */
const MATIERES_DATA = {
    "STIT341(I)": "Analyse de gestion (MERISE)",
    "STIT342(I)": "Modélisation des systèmes d'information (Introduction à UML)",
    "STIT341(IMT)": "Traitement numérique du signal",
    "STIT342(IMT)": "Electronique numérique",
    "STIT341(EEA)": "Electronique de puissance",
    "STIT342(EEA)": "Automatisme programmables et simulation (GRAFCET)",
    "STIT311": "Théorie des langages",
    "STIT312": "Initiation au langage machine",
    "STIT313(G1)": "Système d'exploitation (Groupe 1)",
    "STIT313(G2)": "Système d'exploitation (Groupe 2)",
    "STIT321": "Electronique des communications",
    "STIT322": "Concepts généraux des réseaux",
    "STIT331(G1)": "Programmation impérative et développement logiciel (Groupe 1)",
    "STIT331(G2)": "Programmation impérative et développement logiciel (Groupe 2)",
    "STIT332": "Introduction à la programmation web",
    "STLA351(G1)": "Anglais scientifique et technique (Groupe 1)",
    "STLA351(G2)": "Anglais scientifique et technique (Groupe 2)",
    "STCU361": "S'exprimer pour communiquer",
    "STPR371": "Projet personnalisé tutoré"
};


/**
 * Logique de navigation des onglets
 * Appelle updateDashboard() et sauvegarde le choix
 */
function showTab(tabId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab-button[onclick="showTab('${tabId}')"]`).classList.add('active');
    
    // * NOUVEAU : Sauvegarde l'onglet actif dans la "mémoire" du navigateur
    localStorage.setItem('activeTabId', tabId);
    
    // Met à jour le tableau de bord pour qu'il corresponde à l'onglet
    updateDashboard(); 
}


/**
 * Logique du "Tableau de Bord Intelligent" (inchangée)
 * Prend en compte l'onglet actif et les heures creuses.
 */
function updateDashboard() {
    // 1. Récupérer l'heure et le jour
    const now = new Date();
    const dayIndex = now.getDay();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const jours = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    const idPrefixes = ["", "lun", "mar", "mer", "jeu", "ven", "sam"];
    const paddedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const currentTimeString = `${hour}h${paddedMinutes}`;
    const messageElement = document.getElementById('dashboard-message');
    let welcomeMessage = `Bonjour ! Nous sommes <strong>${jours[dayIndex]}</strong> et il est <strong>${currentTimeString}</strong>.`;
    
    // 2. Effacer les anciens surlignages
    document.querySelectorAll('.cours-actuel').forEach(c => c.classList.remove('cours-actuel'));

    // 3. Gérer les cas simples (week-end ou hors horaires)
    if (dayIndex === 0) {
        messageElement.innerHTML = welcomeMessage + "<br><strong>Bon dimanche !</strong> Repos avant la reprise."; return;
    }
    if (hour < 8) {
        messageElement.innerHTML = welcomeMessage + "<br>Les cours n'ont pas encore commencé. Reprise à 8h !"; return;
    }
    if (hour >= 17) {
        messageElement.innerHTML = welcomeMessage + "<br>Les cours sont terminés pour aujourd'hui. Bonne soirée !"; return;
    }

    // 4. ON EST EN SEMAINE ET DANS LES HORAIRES DE COURS (8h-17h)
    const activeTab = document.querySelector('.tab-button.active');
    const activeGroupId = activeTab ? activeTab.getAttribute('onclick').match(/'([^']+)'/)[1] : 'groupe1';
    const groupPrefix = (activeGroupId === 'groupe1') ? 'g1' : 'g2';
    const dayPrefix = idPrefixes[dayIndex];

    // 5. Récupérer les cellules de cours possibles
    const cell_8h = document.getElementById(`${groupPrefix}_${dayPrefix}_8`);
    const cell_11h = document.getElementById(`${groupPrefix}_${dayPrefix}_11`);
    const cell_14h = document.getElementById(`${groupPrefix}_${dayPrefix}_14`);

    let specificMessage = "";

    // 6. Logique "Heure par Heure"
    if (hour >= 8 && hour < 11) {
        if (cell_8h) {
            highlightCourse(cell_8h);
            specificMessage = "<br><strong>Le cours actuel (" + cell_8h.dataset.matiere + ") clignote.</strong>";
        } else {
            if (cell_11h) {
                specificMessage = "<br>Heure creuse. <strong>Vous reprenez à 11h</strong> avec " + cell_11h.dataset.matiere + ".";
            } else if (cell_14h) {
                specificMessage = "<br>Heure creuse. <strong>Vous reprenez à 14h</strong> avec " + cell_14h.dataset.matiere + ".";
            } else {
                specificMessage = "<br>Vous n'avez plus de cours aujourd'hui pour ce groupe. Profitez-en !";
            }
        }
    } 
    else if (hour >= 11 && hour < 14) {
        if (cell_11h) {
            highlightCourse(cell_11h);
            specificMessage = "<br><strong>Le cours actuel (" + cell_11h.dataset.matiere + ") clignote.</strong>";
        } else {
            if (cell_14h) {
                specificMessage = "<br>Heure creuse. <strong>Vous reprenez à 14h</strong> avec " + cell_14h.dataset.matiere + ".";
            } else {
                specificMessage = "<br>Vous n'avez plus de cours aujourd'hui pour ce groupe. Profitez-en !";
            }
        }
    } 
    else if (hour >= 14 && hour < 17) {
        if (cell_14h) {
            highlightCourse(cell_14h);
            specificMessage = "<br><strong>Le cours actuel (" + cell_14h.dataset.matiere + ") clignote.</strong>";
        } else {
            specificMessage = "<br>Vous n'avez plus de cours aujourd'hui pour ce groupe. Profitez-en !";
        }
    }
    
    // 7. Mettre à jour le message final
    messageElement.innerHTML = welcomeMessage + specificMessage;
}

/* Fonction pour surligner les 3 cellules d'un cours (inchangée) */
function highlightCourse(firstCell) {
    let cell = firstCell;
    for(let i=0; i<3; i++) {
        if(cell) {
            cell.classList.add('cours-actuel');
            cell = cell.nextElementSibling;
        }
    }
}


/* Logique de la Modale (Pop-up) (inchangée) */
const modalContainer = document.getElementById('modal-container');
function openModal(cellElement) {
    const code = cellElement.dataset.matiere;
    const salle = cellElement.dataset.salle;
    const enseignant = cellElement.dataset.enseignant;
    const horaire = cellElement.dataset.horaire;
    const matiereNom = MATIERES_DATA[code] || "Information non disponible";

    document.getElementById('modal-title').textContent = `Détails pour ${code}`;
    document.getElementById('modal-matiere').textContent = matiereNom;
    document.getElementById('modal-code').textContent = code;
    document.getElementById('modal-enseignant').textContent = enseignant;
    document.getElementById('modal-salle').textContent = salle;
    document.getElementById('modal-horaire').textContent = horaire;
    
    modalContainer.style.display = 'flex';
}
function closeModal() {
    modalContainer.style.display = 'none';
}


/* Logique des Filtres */
function applyFilters() {
    const teacherFilter = document.getElementById('filter-teacher').value;
    const subjectFilter = document.getElementById('filter-subject').value;

    // * NOUVEAU : Sauvegarde les filtres dans la "mémoire"
    localStorage.setItem('savedTeacherFilter', teacherFilter);
    localStorage.setItem('savedSubjectFilter', subjectFilter);

    // Le reste de la fonction est inchangé
    const rows = document.querySelectorAll('.schedule-table tbody tr');

    rows.forEach(row => {
        const rowTeacherCells = row.querySelectorAll('td:nth-child(4), td:nth-child(7), td:nth-child(10)');
        const rowSubjectCells = row.querySelectorAll('td:nth-child(2), td:nth-child(5), td:nth-child(8)');

        let teacherMatch = (teacherFilter === 'tous');
        rowTeacherCells.forEach(cell => {
            if (cell.textContent.includes(teacherFilter)) { teacherMatch = true; }
        });
        
        let subjectMatch = (subjectFilter === 'tous');
        rowSubjectCells.forEach(cell => {
            if (cell.textContent.startsWith(subjectFilter)) { subjectMatch = true; }
        });

        if (teacherMatch && subjectMatch) {
            row.classList.remove('row-hidden');
        } else {
            row.classList.add('row-hidden');
        }
    });
}


/**
 * Initialisation de la page (quand tout est chargé)
 * C'est ici qu'on lit la "mémoire"
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // * NOUVEAU : Charger l'onglet sauvegardé
    const savedTabId = localStorage.getItem('activeTabId');
    if (savedTabId) {
        showTab(savedTabId); // Affiche l'onglet sauvegardé
    } else {
        showTab('groupe1'); // Sinon, affiche le groupe 1 par défaut
    }
    
    // * NOUVEAU : Charger les filtres sauvegardés
    const savedTeacher = localStorage.getItem('savedTeacherFilter');
    const savedSubject = localStorage.getItem('savedSubjectFilter');

    if (savedTeacher) {
        document.getElementById('filter-teacher').value = savedTeacher;
    }
    if (savedSubject) {
        document.getElementById('filter-subject').value = savedSubject;
    }
    
    // S'il y avait des filtres sauvegardés, on les applique au chargement
    if (savedTeacher || savedSubject) {
        applyFilters();
    }

    // Met à jour l'horloge et le surlignage toutes les 60 secondes (inchangé)
    setInterval(updateDashboard, 60000); 

    // Attache les clics pour la modale (inchangé)
    document.querySelectorAll('td[data-matiere]').forEach(cell => {
        cell.onclick = () => openModal(cell);
    });

    // Attache les actions pour les filtres (inchangé)
    document.getElementById('filter-teacher').addEventListener('change', applyFilters);
    document.getElementById('filter-subject').addEventListener('change', applyFilters);
    
    document.getElementById('reset-filters').addEventListener('click', () => {
        document.getElementById('filter-teacher').value = 'tous';
        document.getElementById('filter-subject').value = 'tous';
        applyFilters(); // Cela va aussi sauvegarder les filtres réinitialisés (tous/tous)
    });
});