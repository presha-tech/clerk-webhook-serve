import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  arrayUnion,
  getDoc,
} from 'firebase/firestore';
import { db } from './../../config/firebaseConfig';
import { useAuth, useUser } from '@clerk/clerk-expo'; // <-- Removed useSignOut

export default function Home() {
  const router = useRouter();
  const { isSignedIn, signOut } = useAuth(); // <-- Get signOut from useAuth
  const { user } = useUser();

  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Redirect to sign-up if not signed in
  useEffect(() => {
    if (isSignedIn === false) {
      router.replace('/sign-up');
    }
  }, [isSignedIn]);

  const fetchGroups = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'groups'),
        where('members', 'array-contains', user.id)
      );
      const querySnapshot = await getDocs(q);
      const groupData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setGroups(groupData);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const generateJoinCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Error', 'Group name is required.');
      return;
    }

    try {
      await addDoc(collection(db, 'groups'), {
        name: newGroupName.trim(),
        description: newGroupDescription.trim(),
        members: [user.id],
        createdBy: user.id,
        adminId: user.id,
        joinCode: generateJoinCode(),
      });
      setNewGroupName('');
      setNewGroupDescription('');
      setShowCreateModal(false);
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a valid join code.');
      return;
    }

    try {
      const q = query(
        collection(db, 'groups'),
        where('joinCode', '==', joinCode.trim().toUpperCase())
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        Alert.alert('Invalid Code', 'No group found with this code.');
        return;
      }

      const groupDoc = querySnapshot.docs[0];
      const groupId = groupDoc.id;
      const groupData = groupDoc.data();

      if (groupData.members.includes(user.id)) {
        Alert.alert('Already Joined', 'You are already a member of this group.');
        return;
      }

      await updateDoc(doc(db, 'groups', groupId), {
        members: arrayUnion(user.id),
      });

      setJoinCode('');
      setShowJoinModal(false);
      fetchGroups();
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const handleGroupClick = async (groupId) => {
    try {
      const docRef = doc(db, 'groups', groupId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        router.push({ pathname: '/group-members', params: { groupId } });
      } else {
        Alert.alert('Error', 'Group not found.');
      }
    } catch (error) {
      console.error('Error fetching group:', error);
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (isSignedIn && user) fetchGroups();
    
  }, [user, isSignedIn]);

  
  useEffect(() => {
    if (searchQuery.trim() && filteredGroups.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [searchQuery, groups]);

  const handleSignOut = async () => {
    try {
      await signOut(); // <-- Actually sign out from Clerk
      router.replace('/sign-up');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  if (isSignedIn === undefined) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={styles.flexContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.flexContainer}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>BIZZHUB</Text>
        </View>
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchBarInput}
            placeholder="Search groups..."
            placeholderTextColor="#FFCE04"
            value={searchQuery}
            onChangeText={setSearchQuery}
            selectionColor="#FFCE04"
            onFocus={() => {
              if (searchQuery.trim() && filteredGroups.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => {
              // Delay hiding to allow tap on suggestion
              setTimeout(() => setShowSuggestions(false), 150);
            }}
          />
          {showSuggestions && (
            <View style={styles.suggestionsDropdown}>
              <FlatList
                data={filteredGroups}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.suggestionItem}
                    onPress={() => {
                      setSearchQuery(item.name);
                      setShowSuggestions(false);
                      handleGroupClick(item.id);
                    }}
                  >
                    <Text style={styles.suggestionText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          )}
        </View>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.header}>Your Groups</Text>

          {filteredGroups.length === 0 ? (
            <Text style={styles.noGroupText}>
              You are not part of any group yet.
            </Text>
          ) : (
            <View style={{ marginTop: 10 }}>
              {filteredGroups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={styles.groupButton}
                  onPress={() => handleGroupClick(group.id)}
                >
                  <View style={styles.groupRow}>
                    <Image
                      source={require('./../../assets/images/groupicon.png')}
                      style={styles.groupIcon}
                      resizeMode="contain"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.groupText}>{group.name}</Text>
                      {group.description ? (
                        <Text style={styles.groupDescription}>{group.description}</Text>
                      ) : null}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={styles.createGroupButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.createGroupText}>Create Group</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.joinGroupButton}
            onPress={() => setShowJoinModal(true)}
          >
            <Text style={styles.createGroupText}>Join Group via Code</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Create Group Modal */}
        <Modal visible={showCreateModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Create Group</Text>
              <TextInput
                style={styles.input}
                placeholder="Group Name"
                value={newGroupName}
                onChangeText={setNewGroupName}
              />
              <TextInput
                style={styles.input}
                placeholder="Group Description"
                value={newGroupDescription}
                onChangeText={setNewGroupDescription}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCreateGroup}>
                  <Text style={styles.confirmText}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Join Group Modal */}
        <Modal visible={showJoinModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Join Group</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Join Code"
                value={joinCode}
                onChangeText={setJoinCode}
                autoCapitalize="characters"
              />
              <View style={styles.modalActions}>
                <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleJoinGroup}>
                  <Text style={styles.confirmText}>Join</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  headerContainer: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50, 
    marginBottom: 10,
  },
  headerTitle: {
    color: '#FFCE04',
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  contentContainer: {
    padding: 20,
    flexGrow: 1,
    backgroundColor: '#000000',
  },
  searchBarContainer: {
    marginBottom: 1,
    backgroundColor: '#232323',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    position: 'relative',
    zIndex: 10,
  },
  searchBarInput: {
    color: '#FFCE04',
    fontSize: 16,
    padding: 0,
    backgroundColor: 'transparent',
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#232323',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: 180,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomColor: '#444',
    borderBottomWidth: 1,
  },
  suggestionText: {
    color: '#FFCE00',
    fontSize: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#FFCE00',
  },
  noGroupText: {
    fontSize: 16,
    marginBottom: 10,
    color: 'gray',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  createGroupButton: {
    backgroundColor: '#FFCE04',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  joinGroupButton: {
    backgroundColor: '#CCCAC3',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  createGroupText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  groupButton: {
    padding: 10,
    backgroundColor: '#EFE2A8',
    marginBottom: 10,
    borderRadius: 5,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupIcon: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#fff',
  },
  groupText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  groupDescription: {
    color: '#333',
    fontSize: 14,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  cancelText: {
    marginRight: 20,
    fontSize: 16,
    color: 'gray',
  },
  confirmText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  signOutButton: {
    backgroundColor: '#FE2C55',
    padding: 4,
    borderRadius: 5,
    alignItems: 'center',
    margin: 16,
    marginBottom: 24,
  },
  signOutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
