
import { ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-expo';

export default function ProfileTab() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (isSignedIn === undefined) return; // Wait for Clerk to load
    if (!isSignedIn) {
      router.replace('/login');
    } else if (user && user.id) {
      // Pass from=profile for correct back navigation
      router.replace(`/member-profile?memberId=${user.id}&from=profile`);
    }
  }, [isSignedIn, user, router]);

  // Show a loading indicator while redirecting
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
