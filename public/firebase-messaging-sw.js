importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
const firebaseConfig = {
  apiKey: "AIzaSyDjWq7tglRokKa6WpPlZgUSNB1KHuMyG00",
  authDomain: "hush-7bab0.firebaseapp.com",
  projectId: "hush-7bab0",
  storageBucket: "hush-7bab0.firebasestorage.app",
  messagingSenderId: "187237532355",
  appId: "1:187237532355:web:934514ffdaa37304a2d876"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/hush_logo.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
