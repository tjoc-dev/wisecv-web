// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from 'firebase/messaging';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDQeasROFvIc3g2NjMf6OaSfW4rjPaYIvU",
    authDomain: "tjoc-60df5.firebaseapp.com",
    projectId: "tjoc-60df5",
    storageBucket: "tjoc-60df5.firebasestorage.app",
    messagingSenderId: "1094980532590",
    appId: "1:1094980532590:web:47a54b343169cd5360697f",
    measurementId: "G-Y4Z9MRXDE6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const messaging = getMessaging(app);

export { messaging, analytics };