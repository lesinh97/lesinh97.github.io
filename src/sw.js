/* A self-destroying service worker.
 *
 * The old Gatsby site shipped gatsby-plugin-offline, which registered a
 * Workbox worker at this exact path with scope "/". That worker is still
 * installed in the browser of anyone who visited before, and it keeps
 * serving the old cached app shell: a normal reload gets the 2021 site, a
 * hard reload gets the real one, because a hard reload bypasses the worker.
 *
 * It cannot expire on its own. If this path 404s, the browser's update check
 * fails and it keeps the worker it already has. So the file has to exist and
 * has to actively remove itself: take control, drop every cache, unregister,
 * then reload the open pages so they come back from the network.
 *
 * Do not delete this until you are confident no browser still has the old
 * worker registered. It costs one 200 response and nothing else.
 */
self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    (async function () {
      try {
        var keys = await caches.keys();
        await Promise.all(keys.map(function (k) { return caches.delete(k); }));
      } catch (e) {}

      await self.registration.unregister();

      var clients = await self.clients.matchAll({ type: "window" });
      clients.forEach(function (c) {
        try { c.navigate(c.url); } catch (e) {}
      });
    })()
  );
});
