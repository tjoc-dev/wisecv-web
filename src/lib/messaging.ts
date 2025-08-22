import { getToken } from 'firebase/messaging';
import { messaging } from './firebase';
import { registerFCMToken, getFCMTokens, FCMToken } from './api';

/**
 * Initialize FCM token handling for authenticated users
 * Checks for existing tokens and handles notification permissions
 * @param fetchFromServer - Whether to fetch tokens from server (only during login/signup)
 */
export const initializeFCMForUser = async (fetchFromServer: boolean = true): Promise<void> => {
  try {
    // Check if we already have a token in localStorage
    const existingLocalToken = localStorage.getItem('fcm_token');
    
    if (fetchFromServer) {
      // Only fetch from server during login/signup
      const existingTokens = await getFCMTokens();
      const webTokens = existingTokens.filter(token => token.channel === 'WEB');
      
      if (webTokens.length > 0) {
        // User has existing web tokens, store the most recent one in localStorage
        const mostRecentToken = webTokens.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0];
        
        localStorage.setItem('fcm_token', mostRecentToken.token);
        console.log('Existing FCM token found and stored:', mostRecentToken.token);
        
        // Check if notification permission is already granted
        if (Notification.permission === 'granted') {
          console.log('Notification permission already granted');
          return;
        }
      }
    } else {
      // During session restoration, only check localStorage and notification permission
      if (existingLocalToken && Notification.permission === 'granted') {
        console.log('FCM token already available in localStorage during session restoration');
        return;
      }
    }
    
    // No existing tokens or permission not granted, request permission
    await requestNotificationPermission();
    
  } catch (error) {
    console.error('Error initializing FCM for user:', error);
    // If fetching tokens fails, still try to request permission
    try {
      await requestNotificationPermission();
    } catch (permissionError) {
      console.error('Error requesting notification permission:', permissionError);
    }
  }
};

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.YOUR_PUBLIC_VAPID_KEY,
      });
      if (token) {
        console.log('FCM Token:', token);
        // Store token in localStorage
        localStorage.setItem('fcm_token', token);
        // Send the token to your server via API
        await registerFCMToken(token, 'WEB');
        return token;
      } else {
        console.warn('No registration token available. Request permission to generate one.');
      }
    } else {
      console.warn('Notification permission not granted.');
    }
  } catch (error) {
    console.error('Error getting FCM token', error);
  }
};
