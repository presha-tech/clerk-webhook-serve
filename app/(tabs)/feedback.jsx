
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';

const MAX_WORDS = 400;
const FEEDBACK_EMAIL = 'info@systechsoftwares.com';
const HEADER_COLOR = '#FFE164';

export default function FeedbackScreen() {
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const wordCount = feedback.trim().split(/\s+/).filter(Boolean).length;

  const handleSend = async () => {
    if (wordCount === 0) {
      Alert.alert('Feedback Required', 'Please enter your feedback.');
      return;
    }
    if (wordCount > MAX_WORDS) {
      Alert.alert('Word Limit Exceeded', `Please limit your feedback to ${MAX_WORDS} words.`);
      return;
    }
    setSubmitting(true);
    const subject = encodeURIComponent('App Feedback');
    const body = encodeURIComponent(feedback);
    const mailtoUrl = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
    try {
      await Linking.openURL(mailtoUrl);
      setFeedback('');
      Alert.alert('Thank You!', 'Your feedback has been prepared in your email app.');
    } catch (error) {
      Alert.alert('Error', 'Could not open email client.');
    }
    setSubmitting(false);
  };

  const handleBack = () => {
    router.replace('/home');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#000' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.headerSpacer} />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Feedback</Text>
        <View style={{ width: 40 }} /> {/* Placeholder for alignment */}
      </View>
      <View style={styles.container}>
        <Text style={styles.label}>We value your feedback! (max {MAX_WORDS} words)</Text>
        <TextInput
          style={styles.input}
          multiline
          placeholder="Type your feedback here..."
          placeholderTextColor="#888"
          value={feedback}
          onChangeText={setFeedback}
          editable={!submitting}
          maxLength={3000}
        />
        <Text style={styles.wordCount}>
          {wordCount} / {MAX_WORDS} words
        </Text>
        <TouchableOpacity
          style={[
            styles.button,
            (submitting || wordCount === 0 || wordCount > MAX_WORDS) && styles.buttonDisabled,
          ]}
          onPress={handleSend}
          disabled={submitting || wordCount === 0 || wordCount > MAX_WORDS}
        >
          <Text style={styles.buttonText}>{submitting ? 'Sending...' : 'Send Feedback'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headerSpacer: {
    height: 50,
    backgroundColor: '#000',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#222',
    backgroundColor: '#000', 
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFE164', 
    textAlign: 'center',
    letterSpacing: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
  },
  label: {
    fontSize: 18,
    marginBottom: 12,
    color: '#FFE164',
    fontWeight: '600',
  },
  input: {
    minHeight: 120,
    borderColor: '#FFE164',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#181818',
    color: '#fff',
    textAlignVertical: 'top',
  },
  wordCount: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 16,
    color: '#FFE164',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#FFE164',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#b0c4de',
  },
  buttonText: {
    color: '#222',
    fontSize: 18,
    fontWeight: '700',
  },
});
