import * as SecureStore from 'expo-secure-store';
import { ClerkProvider } from '@clerk/clerk-expo';
import { Slot } from 'expo-router';
import { useFonts } from 'expo-font';

// Token cache implementation for Clerk
const tokenCache = {
  async getToken(key) {
    return SecureStore.getItemAsync(key);
  },
  async saveToken(key, value) {
    return SecureStore.setItemAsync(key, value);
  },
};

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
      <Slot />
    </ClerkProvider>
  );
}
