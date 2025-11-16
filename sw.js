// Définit un nom pour notre cache.
// Change ce nom (ex: 'v2') quand tu voudras forcer une mise à jour.
const CACHE_NAME = 'emploi-du-temps-v1';

// La liste des fichiers que ton application doit sauvegarder.
// C'est "l'application shell".
const urlsToCache = [
  '/',
  'index.html',
  'style.css',
  'app.js',
  'icon-192.png',
  'manifest.json'
];

// --- 1. L'ÉVÉNEMENT D'INSTALLATION ---
// S'exécute quand le Service Worker est installé pour la première fois.
self.addEventListener('install', (event) => {
  // On attend que l'installation soit finie
  event.waitUntil(
    // Ouvre le cache avec le nom que nous avons défini
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache ouvert');
        // Ajoute tous les fichiers de notre liste au cache
        return cache.addAll(urlsToCache);
      })
  );
});

// --- 2. L'ÉVÉNEMENT D'ACTIVATION (Mise à jour) ---
// S'exécute quand un nouveau Service Worker remplace l'ancien.
// C'est ici qu'on gère les mises à jour !
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]; // Seul notre nouveau cache est gardé

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Si un cache est ancien (n'est pas dans la whitelist), on le supprime !
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            
            // ** CORRIGÉ ICI : Guillemets doubles à l'extérieur **
            console.log("Suppression de l'ancien cache :", cacheName);
            
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// --- 3. L'ÉVÉNEMENT FETCH (Interception des requêtes) ---
// S'exécute à chaque fois que la page demande un fichier (CSS, JS, image, etc.)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // 1. On cherche d'abord dans le cache
    caches.match(event.request)
      .then((response) => {
        // Si on le trouve dans le cache, on le renvoie
        if (response) {
          return response;
        }
        
        // Si on ne le trouve pas, on le demande au réseau (Internet)
        return fetch(event.request);
      }
    )
  );
});