const CACHE='locoresiduo-offline-v3';
const CORE=['./','./index.html','./manifest.webmanifest','./icon.svg'];
const OPTIONAL=['./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await cache.addAll(CORE);
    await Promise.all(OPTIONAL.map(async path=>{try{await cache.add(path);}catch(e){}}));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key.startsWith('locoresiduo-')&&key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE);
      try{
        const response=await fetch(request);
        if(response.ok)await cache.put('./index.html',response.clone());
        return response;
      }catch(e){
        return (await cache.match('./index.html'))||(await cache.match('./'))||Response.error();
      }
    })());
    return;
  }
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const cached=await cache.match(request,{ignoreSearch:true});
    if(cached)return cached;
    try{
      const response=await fetch(request);
      if(response.ok)await cache.put(request,response.clone());
      return response;
    }catch(e){return Response.error();}
  })());
});
