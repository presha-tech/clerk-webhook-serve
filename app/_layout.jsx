import * as SecureStore from 'expo-secure-store';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { Slot } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import axios from 'axios';

// Token cache implementation for Clerk
const tokenCache = {
  async getToken(key) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key, value) {
    return SecureStore.setItemAsync(key, value);
  },
};

// Custom hook to sync Clerk and Firebase Auth
function useSyncClerkWithFirebase() {
  const { isSignedIn, getToken } = useAuth();

  useEffect(() => {
    const sync = async () => {
      if (!isSignedIn) return;
      try {
        // 1. Get Clerk session token
        const clerkToken = await getToken();
        console.log('🔐 Clerk Token:', clerkToken); // 👈 ADDED for curl testing

        // 2. Exchange Clerk token for Firebase custom token from your backend
        const response = await axios.post(
          'https://clerk-webhook-serve.onrender.com/create-firebase-token',
          {},
          {
            headers: {
              Authorization: `Bearer ${clerkToken}`,
            },
          }
        );

        const { firebaseToken } = response.data;

        // 3. Sign in to Firebase with the custom token
        const firebaseAuth = getAuth();
        await signInWithCustomToken(firebaseAuth, firebaseToken);
        console.log('🔥 Signed into Firebase!');
      } catch (err) {
        console.error('❌ Failed to sync Clerk and Firebase:', err);
      }
    };

    sync();
  }, [isSignedIn, getToken]);
}

// Wrapper to ensure the sync hook is called inside ClerkProvider
function ClerkFirebaseSyncWrapper({ children }) {
  useSyncClerkWithFirebase();
  return children;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter: require('./../assets/fonts/Inter_18pt-Regular.ttf'),
    'Inter-Medium': require('./../assets/fonts/Inter_18pt-Medium.ttf'),
    'Inter-Bold': require('./../assets/fonts/Inter_18pt-SemiBold.ttf'),
  });

  if (!fontsLoaded) return null;

  return (
    <ClerkProvider
      publishableKey="pk_test_cHJvLWVncmV0LTgyLmNsZXJrLmFjY291bnRzLmRldiQ"
      tokenCache={tokenCache}
    >
      <ClerkFirebaseSyncWrapper>
        <Slot />
      </ClerkFirebaseSyncWrapper>
    </ClerkProvider>
  );
}
