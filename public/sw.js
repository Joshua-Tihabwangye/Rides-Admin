self.addEventListener("push", function (event) {
  var data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: "Notification",
      body: event.data ? event.data.text() : "",
    };
  }
  var title = data.title || "EvZone Admin";
  var options = {
    body: data.body || "",
    icon: data.icon || "/icon-192.png",
    data: data.data || {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf("/") === 0 && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
