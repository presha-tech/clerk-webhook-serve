
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { db } from './../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';

export default function MemberProfile() {
  const router = useRouter();
  const { memberId, from, groupId } = useLocalSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  
  const { isSignedIn, userId } = useAuth();

  // Redirect to login if not signed in
  useEffect(() => {
    if (isSignedIn === false) {
      router.replace('/login');
    }
  }, [isSignedIn]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'businessProfiles', memberId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(docSnap.data());
        } else {
          setData(null);
        }
      } catch (err) {
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (memberId && isSignedIn) fetchProfile();
  }, [memberId, isSignedIn]);

  // Handle redirect if no business data and user is viewing their own profile
  useEffect(() => {
    if (
      !loading &&
      isSignedIn &&
      userId &&
      memberId &&
      userId === memberId &&
      data === null
    ) {
      
      router.replace(`/business-dashboard?from=profile`);
    }
  }, [loading, isSignedIn, userId, memberId, data, router]);

  
  const handleBack = () => {
    if (from === 'group-members' && groupId) {
      router.replace({ pathname: '/group-members', params: { groupId } });
    } else if (from === 'profile') {
      router.replace('/home');
    } else {
      router.replace('/');
    }
  };

  // Only allow editing if the current user is the owner of the profile
  const handleEdit = () => {
    if (!isSignedIn) {
      Alert.alert('Please wait', 'Checking permissions...');
      return;
    }
    if (userId === memberId) {
      router.push(
        `/edit-profile?memberId=${memberId}&from=${from || 'profile'}${groupId ? `&groupId=${groupId}` : ''}`
      );
    } else {
      Alert.alert(
        'Permission Denied',
        'You can only edit your own profile.'
      );
    }
  };

  // Copy to clipboard and show feedback
  const handleCopy = async (value, label) => {
    if (!value) return;
    await Clipboard.setStringAsync(value.toString());
    Alert.alert('Copied!', `${label} copied to clipboard.`);
  };

  if (isSignedIn === undefined || loading) {
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
        <TouchableOpacity style={[styles.backButton, { top: 60 }]} onPress={handleBack}>
          <Text style={styles.backButtonText}>{'\u25C0'} Back</Text>
        </TouchableOpacity>
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: 50, paddingBottom: 30 }}
    >
      {/* Back Button */}
      <TouchableOpacity style={[styles.backButton, { top: 60 }]} onPress={handleBack}>
        <Text style={styles.backButtonText}>{'\u25C0'} Back</Text>
      </TouchableOpacity>

      {/* Edit Button */}
      <TouchableOpacity style={[styles.editButton, { top: 60 }]} onPress={handleEdit}>
        <Text style={styles.editButtonText}>Edit</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Business Dashboard</Text>

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
        <View style={[styles.bottomOverlayField, styles.contactNumberField, { flexDirection: 'row', alignItems: 'center' }]}>
          <Text style={styles.detailText}>📞 {contactNumber}</Text>
          <TouchableOpacity
            style={styles.copyBtn}
            onPress={() => handleCopy(contactNumber, 'Contact number')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.copyBtnText}>{'\u29C9'}</Text>
          </TouchableOpacity>
        </View>
        {/* Email */}
        <View style={[styles.bottomOverlayField, styles.emailField, { flexDirection: 'row', alignItems: 'center' }]}>
          <Text style={styles.detailText}>✉️ {email}</Text>
          <TouchableOpacity
            style={styles.copyBtn}
            onPress={() => handleCopy(email, 'Email')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.copyBtnText}>{'\u29C9'}</Text>
          </TouchableOpacity>
        </View>
        {/* Website */}
        <View style={[styles.bottomOverlayField, styles.websiteField, { flexDirection: 'row', alignItems: 'center' }]}>
          <Text style={styles.detailText}>🔗 {website}</Text>
          <TouchableOpacity
            style={styles.copyBtn}
            onPress={() => handleCopy(website, 'Website')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.copyBtnText}>{'\u29C9'}</Text>
          </TouchableOpacity>
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
  editButton: {
    position: 'absolute',
    top: 1,
    right: 10,
    zIndex: 10,
    backgroundColor: '#FBDB58',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FBDB58',
    marginVertical: 55,
    marginLeft: 20,
    marginBottom: 8,
    marginTop: 40,
  },
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
  
  nameField: {
    left: 15,
    top: 45,
  },
  businessNameField: {
    left: 15,
    top: 55,
    backgroundColor: 'transparent',
  },
  descriptionField: {
    left: 15,
    top: 70,
    right: 35,
    // Removed width: 180 to allow full width
  },
  nameText: { fontSize: 18, color: '#000', fontWeight: 'bold', textTransform: 'uppercase' },
  businessNameText: {
    fontSize: 16,
    color: 'red',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 0,
    alignSelf: 'flex-start',
  },
  descriptionText: {
    fontSize: 15,
    color: '#000',
    marginTop: 0,
    alignSelf: 'flex-start',
    maxWidth: '85%', 
  },
  bottomImage: {
    width: '98%',
    height: 315,
    alignSelf: 'center',
    justifyContent: 'flex-start',
    marginTop: 0,
  },
  bottomOverlayField: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '90%',
  },
  contactNumberField: {
    left: 22,
    top: 10,
  },
  emailField: {
    left: 20,
    top: 40,
  },
  websiteField: {
    left: 20,
    top: 70,
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
  copyBtn: {
    marginLeft: 6,
    backgroundColor: '#EFE2A8',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  copyBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 15,
    
  },
});
