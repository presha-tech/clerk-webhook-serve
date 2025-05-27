
import React, { useEffect, useState } from 'react';
import { View, Text, ImageBackground, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { db } from '../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigation } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

export default function UserProfile() {
  const navigation = useNavigation();
  const { isSignedIn, userId } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Redirect to login if not signed in
  useEffect(() => {
    if (isSignedIn === false) {
      navigation.replace('/login');
    }
  }, [isSignedIn]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!userId) return;
        const docRef = doc(db, 'businessProfiles', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(docSnap.data());
        } else {
          console.warn('No business profile found for user:', userId);
        }
      } catch (err) {
        console.error('Failed to fetch business data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isSignedIn) fetchProfile();
  }, [isSignedIn, userId]);

  if (loading || isSignedIn === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No business data found.</Text>
      </View>
    );
  }

  const {
    name,
    businessName,
    businessType,
    businessDescription,
    contactNumber,
    email,
    website,
    address,
    pincode,
  } = data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>{'\u25C0'} Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>My Business Profile</Text>

      {/* Business Type Pill */}
      <View style={styles.pillContainer}>
        <View style={styles.pill}>
          <Text style={styles.pillText}>{businessType}</Text>
        </View>
      </View>

      {/* file.jpg image with individually positioned overlay fields */}
      <ImageBackground
        source={require('../assets/images/file.jpg')}
        style={styles.topImage}
        resizeMode="cover"
        imageStyle={styles.imageRadius}
      >
        {/* Name Field */}
        <View style={[styles.overlayField, styles.nameField]}>
          <Text style={styles.nameText}>{name?.toUpperCase()}</Text>
        </View>
        {/* Business Name Field */}
        <View style={[styles.overlayField, styles.businessNameField]}>
          <Text style={styles.businessNameText}>{businessName?.toUpperCase()}</Text>
        </View>
        {/* Description Field */}
        <View style={[styles.overlayField, styles.descriptionField]}>
          <Text style={styles.descriptionText}>{businessDescription}</Text>
        </View>
      </ImageBackground>

      {/* Reduced spacer between images */}
      <View style={{ height: 10 }} />

      {/* address.jpg image at the bottom with individually positioned contact fields */}
      <ImageBackground
        source={require('../assets/images/address.jpg')}
        style={styles.bottomImage}
        resizeMode="cover"
        imageStyle={styles.imageRadius}
      >
        {/* Contact Number */}
        <View style={[styles.bottomOverlayField, styles.contactNumberField]}>
          <Text style={styles.detailText}>📞 {contactNumber}</Text>
        </View>
        {/* Email */}
        <View style={[styles.bottomOverlayField, styles.emailField]}>
          <Text style={styles.detailText}>✉️ {email}</Text>
        </View>
        {/* Website */}
        <View style={[styles.bottomOverlayField, styles.websiteField]}>
          <Text style={styles.detailText}>🔗 {website}</Text>
        </View>
        {/* Address */}
        <View style={[styles.bottomOverlayField, styles.addressField]}>
          <Text style={styles.detailText}>🏠 {address}</Text>
        </View>
        {/* Pincode */}
        <View style={[styles.bottomOverlayField, styles.pincodeField]}>
          <Text style={styles.detailText}>📮 {pincode}</Text>
        </View>
      </ImageBackground>
    </ScrollView>
  );
}

const IMAGE_HEIGHT = 280;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  backButton: {
    position: 'absolute',
    top: 1,
    left: 3,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.0)',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FBDB58', marginVertical: 55, marginLeft: 20, marginBottom: 8 , marginTop: 40},
  pillContainer: {
    alignItems: 'flex-start',
    marginLeft: 15,
    marginBottom: 15,
    marginTop: 0,
  },
  pill: {
    backgroundColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  pillText: { fontSize: 20, color: '#000', fontWeight: '600' },
  topImage: {
    width: '93%',
    height: IMAGE_HEIGHT,
    alignSelf: 'center',
    justifyContent: 'flex-start',
    marginBottom: 0,
  },
  imageRadius: {
    borderRadius: 15,
  },
  // Overlay fields are absolutely positioned for file.jpg
  overlayField: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 3,
    maxWidth: '90%',
  },
  nameField: {
    left: 12, // x-axis
    top: 7,  // y-axis
  },
  businessNameField: {
    left: 12,
    top: 45,
  },
  descriptionField: {
    left: 12,
    top: 90,
    width: 200,
  },
  nameText: { fontSize: 13, color: '#000', fontWeight: 'bold', textTransform: 'uppercase' },
  businessNameText: {
    fontSize: 14,
    color: 'red',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 0,
    alignSelf: 'flex-start',
  },
  descriptionText: {
    fontSize: 12,
    color: '#000',
    marginTop: 0,
    alignSelf: 'flex-start',
    width: 180,
  },
  bottomImage: {
    width: '98%',
    height: 315,
    alignSelf: 'center',
    justifyContent: 'flex-start',
    marginTop: 0,
  },
  // Overlay fields are absolutely positioned for address.jpg
  bottomOverlayField: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '90%',
  },
  contactNumberField: {
    left: 22,
    top: 18,
  },
  emailField: {
    left: 22,
    top: 50,
  },
  websiteField: {
    left: 22,
    top: 80,
  },
  addressField: {
    left: 25,
    top: 135,
    width: 220,
  },
  pincodeField: {
    left: 25,
    top: 260,
  },
  detailText: { fontSize: 14, color: '#000', marginBottom: 0 },
});
