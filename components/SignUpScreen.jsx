
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSignUp, useAuth } from '@clerk/clerk-expo';
import { Colors } from './../constants/Colors';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import axios from 'axios';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const { signUp, setActive } = useSignUp();
  const { getToken } = useAuth();

  const handleSendOtp = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }
    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      Alert.alert('Error', 'Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await signUp.create({
        emailAddress: trimmedEmail,
      });

      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });

      setPendingVerification(true);
      setMessage('OTP sent! Please check your email.');
    } catch (err) {
      console.log('SignUp error:', err);

      const errorMsg =
        err.errors?.[0]?.message?.toLowerCase() ||
        err.message?.toLowerCase() ||
        '';

      if (
        errorMsg.includes('reserved') ||
        errorMsg.includes('already') ||
        errorMsg.includes('exists') ||
        errorMsg.includes('user found') ||
        errorMsg.includes('account exists') ||
        errorMsg.includes('email address is already in use') ||
        errorMsg.includes('taken')
      ) {
        Alert.alert(
          'Account Exists',
          'You are already registered. Redirecting you to sign in...'
        );
        setTimeout(() => {
          router.replace('/sign-in');
        }, 1500);
        return;
      } else {
        setMessage(err.errors?.[0]?.message || err.message || 'Failed to send OTP.');
      }
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
      const result = await signUp.attemptEmailAddressVerification({
        code: otp,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        // --- Sync Clerk with Firebase Auth ---
        const firebaseOk = await syncClerkWithFirebase();
        if (firebaseOk) {
          router.replace('/business-dashboard');
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

      <Text style={styles.subheading}>Register now!</Text>

      <Text style={styles.subtitle}>
        Enter your email to receive a one-time code for secure, passwordless sign up.
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
        onPress={() => router.replace('/sign-in')}
      >
        <Text style={styles.linkText}>Already have an account? Sign in</Text>
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
