// **MODIFIÉ** : Change le nom du cache pour forcer la mise à jour
const CACHE_NAME = 'emploi-du-temps-v2';

// **MODIFIÉ** : Corrige les chemins pour qu'ils soient relatifs au dossier
const urlsToCache = [
  './', // './' fait référence au dossier courant (/MON-EMPLOI-DU-TEMPS/)
  'index.html',
  'style.css',
  'app.js',
  'icon-192.png',
  'manifest.json'
];

// --- 1. L'ÉVÉNEMENT D'INSTALLATION ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache v2 ouvert');
        // Ajoute les fichiers corrigés au cache
        return cache.addAll(urlsToCache);
      })
  );
});

// --- 2. L'ÉVÉNEMENT D'ACTIVATION (Mise à jour) ---
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]; // Seul notre nouveau cache v2 est gardé

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Si un cache est ancien (n'est pas dans la whitelist), on le supprime !
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log("Suppression de l'ancien cache :", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// --- 3. L'ÉVÉNEMENT FETCH (Interception des requêtes) ---
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