// src/lib/social-auth.ts
import { signup, login } from './api';

// Interface for Google authentication response
interface GoogleAuthResponse {
  email: string;
  given_name: string;
  family_name: string;
  // Add other properties as needed
}

// Function to handle Google authentication
export async function handleGoogleAuth(googleResponse: GoogleAuthResponse, isSignup = false) {
  try {
    // Extract user information from Google response
    const { email, given_name, family_name } = googleResponse;
    
    // Generate a deterministic password based on the user's email
    const password = generateDeterministicPassword(email);
    
    // Get country and currency information
    const country = await getCountryFromIP();
    const currency = getCurrencyFromCountry(country);
    
    // Set appName as required by your API
    const appName = 'wisecv';
    
    // Determine if we should sign up or log in
    if (isSignup) {
      // Call your existing signup API with the Google user information
      return await signup(email, password, given_name, family_name);
    } else {
      // For login, we'll try login first, and if it fails, we'll sign up
      try {
        return await login(email, password);
      } catch (error) {
        // If login fails, try to sign up
        return await signup(email, password, given_name, family_name);
      }
    }
  } catch (error) {
    console.error('Google auth error:', error);
    throw error;
  }
}

// Generate a deterministic password based on user's email
function generateDeterministicPassword(email: string): string {
  // Create a hash from the email
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use the hash to create a deterministic but complex password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  
  // Generate a 16-character deterministic password
  const seed = Math.abs(hash);
  for (let i = 0; i < 16; i++) {
    // Use a deterministic approach to select characters
    const index = (seed + i * i * 31) % chars.length;
    password += chars.charAt(Math.abs(index));
  }
  
  // Ensure password has at least one uppercase, one lowercase, one number, and one special character
  if (!/[A-Z]/.test(password)) password = password.substring(0, 15) + 'A';
  if (!/[a-z]/.test(password)) password = password.substring(0, 14) + 'a' + password.substring(15);
  if (!/[0-9]/.test(password)) password = password.substring(0, 13) + '1' + password.substring(14);
  if (!/[!@#$%^&*()]/.test(password)) password = password.substring(0, 12) + '!' + password.substring(13);
  
  return password;
}

// Helper functions (similar to those in api.ts)
async function getCountryFromIP(): Promise<string> {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code;
  } catch (error) {
    console.error('Error detecting country:', error);
    return 'US'; // Default to US if detection fails
  }
}

function getCurrencyFromCountry(countryCode: string): string {
  return countryCode === 'NG' ? 'NGN' : 'USD';
}