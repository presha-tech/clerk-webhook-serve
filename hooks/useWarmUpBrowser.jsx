import * as WebBrowser from "expo-web-browser";
import { useEffect } from "react";

/**
 * useWarmUpBrowser
 * Warms up the Expo WebBrowser for Clerk authentication flows.
 * - Safe for passwordless email OTP (Clerk) and OAuth.
 * - No passwords, no extra verification unless signed out.
 */
export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};