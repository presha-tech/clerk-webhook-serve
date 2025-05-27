
import React, { useState, useEffect, useRef } from 'react';
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
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebaseConfig';
import { collection, doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@clerk/clerk-expo';

export default function BusinessDashboard() {
  const router = useRouter();
  const { from, groupId } = useLocalSearchParams();
  const { isSignedIn, userId } = useAuth();
  const scrollViewRef = useRef(null);
  const inputRefs = useRef([]);

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
      if (!form[field].trim()) {
        Alert.alert('Missing Field', `Please fill out the ${field} field.`);
        return;
      }
    }

    if (!userId) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }

    try {
      const userDocRef = doc(collection(db, 'businessProfiles'), userId);
      await setDoc(userDocRef, form);
      await AsyncStorage.setItem('dashboardFilled', 'true');
      console.log('✅ Business data saved successfully.');
      router.replace('/home');
    } catch (error) {
      console.error('🔥 Firestore Error:', error);
      Alert.alert('Error', 'Failed to save business data. Please try again.');
    }
  };

  const handleCancel = () => {
    if (from === 'group-members' && groupId) {
      router.replace({ pathname: '/group-members', params: { groupId } });
    } else if (from === 'profile') {
      router.replace('/profile');
    } else {
      router.replace('/');
    }
  };

  // Scroll to the focused input so it's always visible above the keyboard
  const handleInputFocus = (index) => {
    setTimeout(() => {
      if (
        scrollViewRef.current &&
        inputRefs.current[index] &&
        typeof inputRefs.current[index].measureLayout === 'function'
      ) {
        inputRefs.current[index].measureLayout(
          scrollViewRef.current.getInnerViewNode(),
          (x, y, width, height) => {
            // Scroll so that the input is above the keyboard
            scrollViewRef.current.scrollTo({ y: y - 40, animated: true });
          }
        );
      }
    }, 250);
  };

  const handleInputSubmitEditing = (index) => {
    const formKeys = Object.keys(form);
    const nextIndex = index + 1;
    if (nextIndex < formKeys.length && inputRefs.current[nextIndex]) {
      inputRefs.current[nextIndex].focus();
    }
  };

  if (isSignedIn === undefined) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 80}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        bounces={true}
        keyboardDismissMode="interactive"
      >
        <Text style={styles.title}>Business Dashboard</Text>
        <Text style={styles.subtitle}>Fill in your Business Details below</Text>

        {Object.entries(form).map(([key, value], index) => (
          <TextInput
            key={key}
            ref={ref => (inputRefs.current[index] = ref)}
            style={[
              styles.input,
              (key === 'businessDescription' || key === 'address') && styles.multilineInput
            ]}
            placeholder={
              key.charAt(0).toUpperCase() +
              key.slice(1).replace(/([A-Z])/g, ' $1') +
              (key === 'unitNumber' ? ' (Optional)' : '')
            }
            value={value}
            onChangeText={(text) => handleChange(key, text)}
            onFocus={() => handleInputFocus(index)}
            onSubmitEditing={() => handleInputSubmitEditing(index)}
            placeholderTextColor="#6B6B6B"
            multiline={key === 'businessDescription' || key === 'address'}
            numberOfLines={key === 'businessDescription' || key === 'address' ? 4 : 1}
            textAlignVertical={key === 'businessDescription' || key === 'address' ? 'top' : 'center'}
            autoComplete="off"
            autoCorrect={false}
            autoCapitalize="none"
            spellCheck={false}
            textContentType="none"
            importantForAutofill="no"
            blurOnSubmit={false}
            returnKeyType={index === Object.keys(form).length - 1 ? 'done' : 'next'}
          />
        ))}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.cancelButton, styles.buttonHalf]} onPress={handleCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.buttonHalf]} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        </View>
        {/* No need for extra bottom padding, scroll-to-input handles visibility */}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 40,
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#F4D34B',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter',
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
  },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderColor: '#000000',
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#000',
    minHeight: 48,
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 20,
  },
  buttonHalf: {
    flex: 1,
    marginHorizontal: 5,
  },
  button: {
    backgroundColor: '#F4D34B',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#000',
  },
  cancelButton: {
    backgroundColor: '#737373',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#fff',
  },
});
