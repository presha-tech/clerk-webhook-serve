
import { useUser } from '@clerk/clerk-expo';

/**
 * useCurrentUser: Returns the current signed-in Clerk user object, or null if not signed in.
 * - Uses Clerk for passwordless email OTP authentication.
 * - No passwords, no verification unless signed out.
 */
export function useCurrentUser() {
  const { user } = useUser();
  return user;
}
