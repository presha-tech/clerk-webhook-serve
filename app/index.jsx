import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (isSignedIn === undefined) return;

    const checkDashboard = async () => {
      if (isSignedIn) {
        const filled = await AsyncStorage.getItem('dashboardFilled');
        if (filled === 'true') {
          router.replace('/home');
        } else {
          router.replace('/business-dashboard');
        }
      } else {
        router.replace('/sign-in');
      }
      setChecking(false);
    };

    checkDashboard();
  }, [isSignedIn, router]);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return null;
}