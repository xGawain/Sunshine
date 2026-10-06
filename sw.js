/* Sunshine: funciona sin conexión. La página se pide primero a la red para recibir versiones nuevas; si no hay red, sale de la copia guardada. */
var CACHE = 'sunshine-3';
var BASE = ['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(BASE); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })); }).then(function(){ return self.clients.claim(); }));
});
function guardar(req, res){ if (res && (res.ok || res.type === 'opaque')){ var copia = res.clone(); caches.open(CACHE).then(function(c){ c.put(req, copia); }); } return res; }
self.addEventListener('fetch', function(e){
  var req = e.request; if (req.method !== 'GET') return;
  var url = new URL(req.url), propia = url.origin === self.location.origin, fuente = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!propia && !fuente) return;
  if (propia && (req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname))){
    e.respondWith(fetch(req).then(function(res){ return guardar('index.html', res); }).catch(function(){ return caches.match('index.html').then(function(r){ return r || caches.match('./'); }); }));
    return;
  }
  e.respondWith(caches.match(req).then(function(hit){
    var red = fetch(req).then(function(res){ return guardar(req, res); }).catch(function(){ return hit; });
    return hit || red;
  }));
});
