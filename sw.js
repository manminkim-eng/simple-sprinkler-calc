/* ═══════════════════════════════════════════════════════════════
   간이스프링클러설비 펌프 용량 계산서 — Service Worker
   ENGINEER KIM MANMIN · Ver-2.0
   전략: Cache-First (정적 자산) + Network-First (외부 CDN)
   ═══════════════════════════════════════════════════════════════ */

const CACHE_NAME    = 'easy-sprinkler-v2.0';
const CDN_CACHE     = 'easy-sprinkler-cdn-v2.0';
const OFFLINE_PAGE  = './index.html';

/* ── 앱 셸 (즉시 캐시) ───────────────────────────────────────── */
const APP_SHELL = [
  './index.html',
  './manifest.json',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './icons/favicon-16.png',
];

/* ── CDN 리소스 (네트워크 우선, 캐시 폴백) ────────────────────── */
const CDN_ORIGINS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://unpkg.com',
];

/* ══════════════════════════════════════════════════════════════
   INSTALL  — 앱 셸 프리캐시
   ══════════════════════════════════════════════════════════════ */
self.addEventListener('install', (event) => {
  console.log('[SW] Install — 앱 셸 프리캐시 시작');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] 앱 셸 캐시 중...');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        console.log('[SW] 앱 셸 캐시 완료 — skipWaiting 호출');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.warn('[SW] 프리캐시 실패 (일부 리소스 없음):', err);
        // 실패해도 설치는 계속 진행
        return self.skipWaiting();
      })
  );
});

/* ══════════════════════════════════════════════════════════════
   ACTIVATE  — 구버전 캐시 정리
   ══════════════════════════════════════════════════════════════ */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate — 구버전 캐시 정리');
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        const VALID = [CACHE_NAME, CDN_CACHE];
        return Promise.all(
          keys
            .filter((k) => !VALID.includes(k))
            .map((k) => {
              console.log('[SW] 구버전 캐시 삭제:', k);
              return caches.delete(k);
            })
        );
      })
      .then(() => {
        console.log('[SW] clients.claim 호출');
        return self.clients.claim();
      })
  );
});

/* ══════════════════════════════════════════════════════════════
   FETCH  — 요청 가로채기
   ══════════════════════════════════════════════════════════════ */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ── 1) POST / 비-GET 요청 → 그냥 통과 ────────────────────
  if (request.method !== 'GET') return;

  // ── 2) chrome-extension 등 무시 ──────────────────────────
  if (!url.protocol.startsWith('http')) return;

  // ── 3) CDN 리소스 → Network-First + CDN 캐시 ──────────────
  const isCDN = CDN_ORIGINS.some((o) => url.origin === new URL(o).origin || url.href.startsWith(o));
  if (isCDN) {
    event.respondWith(networkFirstWithCDNCache(request));
    return;
  }

  // ── 4) 로컬 자산 → Cache-First + 네트워크 폴백 ─────────────
  event.respondWith(cacheFirstWithNetworkFallback(request));
});

/* ── Cache-First 전략 ─────────────────────────────────────────
   캐시 히트 → 즉시 반환
   캐시 미스 → 네트워크 → 캐시 저장
   네트워크 실패 → 오프라인 페이지 ──────────────────────────── */
async function cacheFirstWithNetworkFallback(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (_) {
    // 오프라인 — HTML 요청이면 index.html 반환
    if (request.headers.get('accept')?.includes('text/html')) {
      const offline = await caches.match(OFFLINE_PAGE);
      if (offline) return offline;
    }
    return new Response('오프라인 상태입니다. 앱을 먼저 온라인에서 한 번 열어주세요.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

/* ── Network-First 전략 (CDN) ─────────────────────────────────
   네트워크 성공 → 응답 + CDN 캐시 갱신
   네트워크 실패 → CDN 캐시 폴백 ─────────────────────────────── */
async function networkFirstWithCDNCache(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CDN_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (_) {
    const cached = await caches.match(request, { cacheName: CDN_CACHE });
    if (cached) return cached;
    return new Response('', { status: 503 });
  }
}

/* ══════════════════════════════════════════════════════════════
   MESSAGE  — 클라이언트로부터 명령 수신
   ══════════════════════════════════════════════════════════════ */
self.addEventListener('message', (event) => {
  if (event.data?.action === 'SKIP_WAITING') {
    console.log('[SW] SKIP_WAITING 메시지 수신 → skipWaiting');
    self.skipWaiting();
  }
  if (event.data?.action === 'CLEAR_CACHE') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => console.log('[SW] 전체 캐시 삭제 완료'));
  }
});

/* ══════════════════════════════════════════════════════════════
   PUSH  — 향후 알림 확장용 (현재 미사용)
   ══════════════════════════════════════════════════════════════ */
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: '간이스프링클러 계산서', body: '업데이트가 있습니다.' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icons/icon-192.png',
      badge: './icons/icon-72.png',
    })
  );
});
