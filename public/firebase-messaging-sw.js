importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyDQeasROFvIc3g2NjMf6OaSfW4rjPaYIvU",
    authDomain: "tjoc-60df5.firebaseapp.com",
    projectId: "tjoc-60df5",
    storageBucket: "tjoc-60df5.firebasestorage.app",
    messagingSenderId: "1094980532590",
    appId: "1:1094980532590:web:47a54b343169cd5360697f",
    measurementId: "G-Y4Z9MRXDE6"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
