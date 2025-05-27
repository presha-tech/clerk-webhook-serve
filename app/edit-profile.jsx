import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { db } from '../config/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

export default function EditProfile() {
  // Get both memberId and 'from' param from the route
  const { memberId, from } = useLocalSearchParams();
  const router = useRouter();
  const { isSignedIn, userId } = useAuth();

  // Redirect to login if not signed in
  useEffect(() => {
    if (isSignedIn === false) {
      router.replace('/login');
    }
  }, [isSignedIn]);

  const [form, setForm] = useState({
    name: '',
    businessName: '',
    businessType: '',
    businessDescription: '',
    contactNumber: '',
    email: '',
    website: '',
    address: '',
    pincode: '',
    unitNumber: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'businessProfiles', memberId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setForm({ ...form, ...docSnap.data() });
        } else {
          Alert.alert('Error', 'Profile not found.');
          handleBack();
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to fetch profile.');
        handleBack();
      } finally {
        setLoading(false);
      }
    };
    if (memberId && isSignedIn) fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId, isSignedIn]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    const requiredFields = [
      'name',
      'businessName',
      'businessType',
      'businessDescription',
      'contactNumber',
      'email',
      'website',
      'address',
      'pincode',
    ];
    for (let field of requiredFields) {
      if (!form[field] || !form[field].trim()) {
        Alert.alert('Missing Field', `Please fill out the ${field} field.`);
        return;
      }
    }
    if (!userId) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    try {
      const userDocRef = doc(db, 'businessProfiles', memberId);
      await setDoc(userDocRef, form);
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.replace(`/member-profile?memberId=${memberId}&from=${from || ''}`) },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  // Context-aware back/cancel navigation
  const handleBack = () => {
    if (from === 'profile') {
      router.replace('/'); // Home screen
    } else if (from === 'group-members') {
      router.replace('/group-members');
    } else {
      router.replace('/'); // Default to home if 'from' is missing
    }
  };

  if (isSignedIn === undefined || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Edit Business Profile</Text>
        {Object.entries(form).map(([key, value]) => (
          <TextInput
            key={key}
            style={styles.input}
            placeholder={
              key.charAt(0).toUpperCase() +
              key.slice(1).replace(/([A-Z])/g, ' $1') +
              (key === 'unitNumber' ? ' (Optional)' : '')
            }
            value={value}
            onChangeText={(text) => handleChange(key, text)}
          />
        ))}
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Save Changes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={handleBack}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 20,
    flexGrow: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#F4D34B',
  },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderColor: '#ccc',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#F4D34B',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#000',
  },
});