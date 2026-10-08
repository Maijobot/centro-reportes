const CACHE = 'cr-zn-v1';
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // no cachear gviz/Drive
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(function(){ return caches.match('index.html'); }));
    return;
  }
  e.respondWith(
    caches.open(CACHE).then(function(c){
      return c.match(req).then(function(hit){
        var net = fetch(req).then(function(res){ if (res && res.ok) c.put(req, res.clone()); return res; })
                             .catch(function(){ return hit; });
        return hit || net;
      });
    })
  );
});
