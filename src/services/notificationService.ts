import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getFirebaseMessaging, db } from '../config/firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Push notification service using Firebase Cloud Messaging.
 * Messaging is lazy-loaded to avoid registering a service worker at startup,
 * which would set COOP headers that block signInWithPopup on desktop.
 */

export async function requestNotificationPermission(userId?: string): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied.');
      return false;
    }

    // Lazy-load messaging only after the user grants permission
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.warn('Firebase Messaging could not be initialized');
      return false;
    }

    const { getToken, onMessage } = await import('firebase/messaging');

    // Get the FCM token
    const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });

    if (currentToken) {
      console.log('FCM Token received successfully');

      // Save the token to the user's document if a userId is provided
      if (userId && db) {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(currentToken)
        });
      }

      // Start listening for foreground messages
      onMessage(messaging, (payload) => {
        console.log('[Foreground FCM Message Received]', payload);
        if (payload.notification?.title && payload.notification?.body) {
          showLocalNotification(payload.notification.title, payload.notification.body);
        }
      });

      return true;
    } else {
      console.log('No FCM registration token available.');
      return false;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return false;
  }
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator;
}

/**
 * Show a local notification (used as fallback or for foreground messages)
 */
export function showLocalNotification(title: string, body: string): void {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/logo2.png',
      badge: '/logo2.png',
    });
  }
}
