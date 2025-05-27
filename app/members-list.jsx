import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuth } from '@clerk/clerk-expo';

export default function MembersList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isSignedIn } = useAuth();

  // Redirect to login if not signed in
  useEffect(() => {
    if (isSignedIn === false) {
      router.replace('/login');
    }
  }, [isSignedIn]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'businessProfiles'));
        const membersData = [];
        querySnapshot.forEach(doc => {
          membersData.push({ id: doc.id, ...doc.data() });
        });
        setMembers(membersData);
      } catch (err) {
        console.error('Failed to load members:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isSignedIn) fetchMembers();
  }, [isSignedIn]);

  if (loading || isSignedIn === undefined) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!members.length) {
    return (
      <View style={styles.centered}>
        <Text>No members found.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={members}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/member-profile?memberId=${item.id}`)}
        >
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.subText}>{item.businessName}</Text>
          <Text style={styles.subText}>{item.contactNumber}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#F3F3F3',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
  },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  subText: { fontSize: 14, color: '#666', marginTop: 4 },
});
