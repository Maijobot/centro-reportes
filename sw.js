const CACHE = 'cr-zn-v2';
const SCOPE = self.registration ? new URL(self.registration.scope).pathname.replace(/\/+$/, '') : '';
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.map(function(k){ return k === CACHE ? null : caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // no cachear gviz/Drive
  if (req.mode === 'navigate') {
    var isAppRoot = url.pathname.replace(/\/+$/, '') === SCOPE;
    e.respondWith(fetch(req).catch(function(){
      // Solo la raíz de la app cae al index cacheado. Un reporte que falle
      // NUNCA debe devolver la app: eso hacía parecer que el enlace "no abría".
      if (isAppRoot) return caches.match('index.html');
      return new Response(
        '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
        '<title>Sin conexión</title><body style="font:16px system-ui;padding:40px;text-align:center;color:#041E42">' +
        'No se pudo abrir el reporte.<br>Revisa tu conexión y vuelve a intentar.</body>',
        {status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' }});
    }));
    return;
  }
  e.respondWith(
    caches.open(CACHE).then(function(c){
      return fetch(req).then(function(res){
        if (res && res.ok) c.put(req, res.clone());
        return res;
      }).catch(function(){
        return c.match(req).then(function(hit){ return hit || Response.error(); });
      });
    })
  );
});
