import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { Colors } from './../constants/Colors';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import axios from 'axios';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { signIn, setActive } = useSignIn();
  const { isSignedIn, isLoaded, getToken } = useAuth();

  // 1. If already signed in, redirect to /home
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/home');
    }
  }, [isLoaded, isSignedIn, router]);

  // --- FIX: Wait for Clerk to load before showing UI ---
  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
      </View>
    );
  }

  // Only show sign-in UI if not signed in
  if (isSignedIn) {
    return null;
  }

  const handleSendOtp = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await signIn.create({
        identifier: email,
        strategy: 'email_code',
      });

      setPendingVerification(true);
      setMessage('OTP sent! Please check your email.');
    } catch (err) {
      const errorMsg = err.errors?.[0]?.message || err.message || 'Failed to send OTP.';
      if (
        errorMsg.toLowerCase().includes('session already exists') ||
        errorMsg.toLowerCase().includes('already signed in')
      ) {
        router.replace('/home');
        return;
      }
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // --- Clerk to Firebase Auth Sync ---
  const syncClerkWithFirebase = async () => {
    try {
      const clerkToken = await getToken();
      const response = await axios.post(
        'https://clerk-webhook-serve.onrender.com/create-firebase-token',
        {},
        { headers: { Authorization: `Bearer ${clerkToken}` } }
      );
      const { firebaseToken } = response.data;
      await signInWithCustomToken(getAuth(), firebaseToken);
      console.log('🔥 Signed into Firebase!');
      return true;
    } catch (err) {
      console.error('Failed to sync Clerk and Firebase:', err);
      setMessage('Failed to sign in to Firebase. Please try again.');
      return false;
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: otp,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        // --- Sync Clerk with Firebase Auth ---
        const firebaseOk = await syncClerkWithFirebase();
        if (firebaseOk) {
          router.replace('/home');
        }
        // If Firebase sign-in fails, error message is shown and user stays on this screen
      } else {
        setMessage('Invalid OTP. Please try again.');
      }
    } catch (err) {
      const errorMsg = err.errors?.[0]?.message || err.message || 'Invalid OTP. Please try again.';
      if (
        errorMsg.toLowerCase().includes('session already exists') ||
        errorMsg.toLowerCase().includes('already signed in')
      ) {
        router.replace('/home');
        return;
      }
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('./../assets/images/BizzhubLogo.png')}
        style={styles.logo}
      />

      <Text style={styles.title}>
        <Text style={{ color: Colors.PRIMARY }}>Business Directory</Text>
      </Text>

      <Text style={styles.subheading}>Sign In</Text>

      <Text style={styles.subtitle}>
        Enter your email to receive a one-time code for secure, passwordless login.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter your email"
        placeholderTextColor={Colors.GRAY}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!pendingVerification}
      />

      {pendingVerification && (
        <TextInput
          style={styles.input}
          placeholder="Enter OTP"
          placeholderTextColor={Colors.GRAY}
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          autoCapitalize="none"
        />
      )}

      {!pendingVerification ? (
        <TouchableOpacity
          style={[styles.btn, styles.blackBtn]}
          onPress={handleSendOtp}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Sending OTP...' : 'SEND OTP'}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.btn, styles.blackBtn]}
          onPress={handleVerifyOtp}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Verifying...' : 'VERIFY OTP'}</Text>
        </TouchableOpacity>
      )}

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <TouchableOpacity
        style={styles.linkBtn}
        onPress={() => router.replace('/sign-up')}
      >
        <Text style={styles.linkText}>Click here to register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 60,
    flex: 1,
    backgroundColor: '#fff',
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    resizeMode: 'contain',
    marginBottom: 5,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  subheading: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    color: Colors.GRAY,
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.GRAY,
    padding: 14,
    borderRadius: 10,
    marginBottom: 15,
    fontWeight: 'bold',
    fontSize: 16,
  },
  btn: {
    backgroundColor: Colors.PRIMARY,
    padding: 10,
    borderRadius: 4,
    marginBottom: 20,
  },
  blackBtn: {
    backgroundColor: '#000',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  message: {
    textAlign: 'center',
    color: Colors.PRIMARY,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  linkBtn: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: Colors.PRIMARY,
    fontWeight: 'bold',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});