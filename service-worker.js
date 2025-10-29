const CACHE_NAME = 'hexa-v1.0.0';
const urlsToCache = [
  '/evanescent-chroma-hexa/',
  '/evanescent-chroma-hexa/index.html',
  '/evanescent-chroma-hexa/style.css',
  '/evanescent-chroma-hexa/game.js',
  '/evanescent-chroma-hexa/icons/icon-192.png',
  '/evanescent-chroma-hexa/icons/icon-512.png'
];

// インストール
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('キャッシュを開きました');
        return cache.addAll(urlsToCache);
      })
  );
});

// フェッチ（Cache-first戦略）
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにあればそれを返す、なければネットワークから取得
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// 古いキャッシュの削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
