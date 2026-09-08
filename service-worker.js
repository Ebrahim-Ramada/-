// Service Worker لتطبيق غرفة المراقبة المركزية
// وظيفته: تفعيل إمكانية "التثبيت كتطبيق" + العمل بدون إنترنت + ضمان وصول آخر تحديث دائمًا
const CACHE_NAME = 'control-room-v2'; // ⬅️ زِد الرقم ده مع كل تحديث مستقبلي تنشره
const APP_SHELL = ['./', './index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(()=>{})
  );
  self.skipWaiting(); // فعّل نسخة الكود الجديدة فورًا بدل انتظار إغلاق كل النوافذ
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim(); // تحكّم فورًا في كل نافذة/تطبيق مفتوح بدل انتظار إعادة فتحه
});

// استراتيجية: اجلب من الشبكة دائمًا أولًا (متجاوزًا أي كاش HTTP قديم بالمتصفح نفسه)
// ولو الإنترنت مقطوع فقط، استخدم آخر نسخة محفوظة محليًا
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone)).catch(()=>{});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// السماح للتطبيق بطلب تفعيل النسخة الجديدة فورًا عند الضغط على "تحديث الآن" من الإعدادات
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
