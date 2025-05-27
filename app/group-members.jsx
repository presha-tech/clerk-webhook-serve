import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { db } from "./../config/firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
  arrayUnion,
  query,
  collection,
  where,
  getDocs,
  deleteDoc, 
} from "firebase/firestore";
import * as Contacts from "expo-contacts";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "@clerk/clerk-expo";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

function normalizePhone(phone) {
  return phone.replace(/[\s\-()]/g, '');
}

// Helper to generate all possible variants for Indian numbers
function getPhoneVariants(phone) {
  const normalized = normalizePhone(phone);
  let variants = [normalized];

  if (normalized.startsWith('+91') && normalized.length === 13) {
    const tenDigit = normalized.slice(3);
    variants.push(tenDigit);
    variants.push('0' + tenDigit);
    variants.push('91' + tenDigit);
  }
  if (/^\d{10}$/.test(normalized)) {
    variants.push('+91' + normalized);
    variants.push('0' + normalized);
    variants.push('91' + normalized);
  }
  if (/^0\d{10}$/.test(normalized)) {
    const tenDigit = normalized.slice(1);
    variants.push(tenDigit);
    variants.push('+91' + tenDigit);
    variants.push('91' + tenDigit);
  }
  if (/^91\d{10}$/.test(normalized)) {
    const tenDigit = normalized.slice(2);
    variants.push(tenDigit);
    variants.push('+91' + tenDigit);
    variants.push('0' + tenDigit);
  }
  if (normalized.startsWith('+')) {
    variants.push(normalized.slice(1));
  }
  return Array.from(new Set(variants));
}

const GroupMembers = () => {
  const { groupId } = useLocalSearchParams();
  const router = useRouter();
  const { isSignedIn, userId } = useAuth();

  useEffect(() => {
    if (isSignedIn === false) {
      router.replace('/login');
    }
  }, [isSignedIn]);

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [contactsModalVisible, setContactsModalVisible] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  const [contactsSearch, setContactsSearch] = useState("");
  const [filteredContacts, setFilteredContacts] = useState([]);

  const [editingDescription, setEditingDescription] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [newGroupName, setNewGroupName] = useState(""); // For editing group name

  const fetchGroup = async () => {
    try {
      const groupDoc = await getDoc(doc(db, "groups", groupId));
      if (groupDoc.exists()) {
        const groupData = { id: groupDoc.id, ...groupDoc.data() };
        setGroup(groupData);
        setNewDescription(groupData.description || "");
        setNewGroupName(groupData.name || "");
        fetchGroupMembers(groupData.members);
      }
    } catch (error) {
      console.error("Error fetching group:", error);
    }
  };

  const fetchGroupMembers = async (memberIds) => {
    try {
      const fetched = await Promise.all(
        memberIds.map(async (uid) => {
          const userDoc = await getDoc(doc(db, "businessProfiles", uid));
          return userDoc.exists() ? { id: uid, ...userDoc.data() } : null;
        })
      );
      const cleaned = fetched.filter(Boolean);
      const others = cleaned.filter((m) => m.id !== userId);

      let currentUserData = null;
      if (userId) {
        const currentUserDoc = await getDoc(doc(db, "businessProfiles", userId));
        currentUserData = currentUserDoc.exists()
          ? { id: userId, ...currentUserDoc.data(), isMe: true }
          : { id: userId, name: "Me", isMe: true };
      }

      const sortedMembers = currentUserData ? [currentUserData, ...others] : others;
      setMembers(sortedMembers);
      setFilteredMembers(sortedMembers);
    } catch (error) {
      console.error("Error fetching group members:", error);
    }
  };

  useEffect(() => {
    if (isSignedIn) fetchGroup();
    // eslint-disable-next-line
  }, [isSignedIn]);

  useEffect(() => {
    if (search.trim()) {
      const lower = search.toLowerCase();
      setFilteredMembers(
        members.filter((m) =>
          ((m.name || "").toLowerCase().includes(lower)) ||
          ((m.businessName || "").toLowerCase().includes(lower))
        )
      );
    } else {
      setFilteredMembers(members);
    }
  }, [search, members]);

  useEffect(() => {
    setFilteredContacts(contacts);
  }, [contacts]);

  const isAdmin = userId === group?.adminId;

  const handleRemoveMember = async (memberId) => {
    if (!isAdmin) return;
    Alert.alert("Confirm", "Remove this member from the group?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await updateDoc(doc(db, "groups", group.id), {
              members: arrayRemove(memberId),
            });
            fetchGroup();
          } catch (error) {
            console.error("Error removing member:", error);
          }
        },
      },
    ]);
  };

  const handleAddFromContacts = async () => {
    if (!isAdmin) return;
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "We need access to your contacts to add members from your phonebook."
      );
      return;
    }
    setContactsLoading(true);
    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails],
    });
    const filtered = data.filter(
      (c) => (c.phoneNumbers && c.phoneNumbers.length > 0) || (c.emails && c.emails.length > 0)
    );
    setContacts(filtered);
    setContactsLoading(false);
    setContactsModalVisible(true);
    setContactsSearch(""); 
    setFilteredContacts(filtered); 
  };

  const handleContactsSearch = () => {
    const query = contactsSearch.trim().toLowerCase();
    if (!query) {
      setFilteredContacts(contacts);
      return;
    }
    setFilteredContacts(
      contacts.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(query)) ||
          (c.phoneNumbers &&
            c.phoneNumbers.some((p) =>
              p.number.replace(/\s+/g, "").includes(query.replace(/\s+/g, ""))
            )) ||
          (c.emails &&
            c.emails.some((e) =>
              e.email.toLowerCase().includes(query)
            ))
      )
    );
  };

  const handleSelectContact = async (contact) => {
    if (!isAdmin) return;
    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      for (let phoneObj of contact.phoneNumbers) {
        const rawPhone = phoneObj.number;
        const variants = getPhoneVariants(rawPhone);

        for (let variant of variants) {
          try {
            const q = query(
              collection(db, "businessProfiles"),
              where("contactNumber", "==", variant)
            );
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
              const userToAdd = snapshot.docs[0].id;
              if (group.members.includes(userToAdd)) {
                Alert.alert("User already a member");
                setContactsModalVisible(false);
                return;
              }
              await updateDoc(doc(db, "groups", group.id), {
                members: arrayUnion(userToAdd),
              });
              setContactsModalVisible(false);
              fetchGroup();
              Alert.alert("Success", "Member added from contacts.");
              return;
            }
          } catch (error) {
            console.error("Error adding member from contacts:", error);
          }
        }
      }
    }
    if (contact.emails && contact.emails.length > 0) {
      for (let emailObj of contact.emails) {
        const email = emailObj.email.toLowerCase();
        try {
          const q = query(
            collection(db, "businessProfiles"),
            where("email", "==", email)
          );
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const userToAdd = snapshot.docs[0].id;
            if (group.members.includes(userToAdd)) {
              Alert.alert("User already a member");
              setContactsModalVisible(false);
              return;
            }
            await updateDoc(doc(db, "groups", group.id), {
              members: arrayUnion(userToAdd),
            });
            setContactsModalVisible(false);
            fetchGroup();
            Alert.alert("Success", "Member added from contacts.");
            return;
          }
        } catch (error) {
          console.error("Error adding member from contacts (email):", error);
        }
      }
    }
    Alert.alert("User not found", "No matching user found for this contact.");
  };

  const handleCopyCode = async () => {
    if (!isAdmin) return;
    if (group && group.joinCode) {
      await Clipboard.setStringAsync(group.joinCode);
      Alert.alert("Copied", "Group code copied to clipboard!");
    }
  };

  // Save both group name and description
  const handleSaveDescription = async () => {
    if (!group || !isAdmin) return;
    try {
      await updateDoc(doc(db, "groups", group.id), {
        name: newGroupName.trim() || group.name,
        description: newDescription.trim(),
      });
      setEditingDescription(false);
      fetchGroup();
      Alert.alert("Success", "Group details updated.");
    } catch (error) {
      Alert.alert("Error", "Failed to update group details.");
    }
  };

  const handleDeleteGroup = async () => {
    if (!isAdmin || !group) return;
    Alert.alert(
      "Delete Group",
      "Are you sure you want to delete this group? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "groups", group.id));
              Alert.alert("Deleted", "Group has been deleted.");
              router.replace("/home");
            } catch (error) {
              Alert.alert("Error", "Failed to delete group.");
              console.error("Error deleting group:", error);
            }
          },
        },
      ]
    );
  };

  // --- MODIFIED: Add MemberIcon to each member row ---
  const renderMember = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        router.push(`/member-profile?memberId=${item.id}&from=group-members&groupId=${group?.id}`)
      }
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomColor: "#333",
        borderBottomWidth: 1,
      }}
    >
      {/* Member Icon */}
      <View style={styles.memberIconContainer}>
        <Image
          source={require("../assets/images/MemberIcon.png")}
          style={styles.memberIcon}
          resizeMode="contain"
        />
      </View>
      {/* Member Info */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>
          {item.isMe ? "Me" : item.name || item.email || item.id}
        </Text>
        {item.businessName && (
          <Text style={{ color: "#FBDB58", fontSize: 14 }}>{item.businessName}</Text>
        )}
        {item.unitNumber && (
          <Text style={{ color: "gray", fontSize: 12 }}>Unit: {item.unitNumber}</Text>
        )}
      </View>
      {isAdmin && item.id !== userId && (
        <TouchableOpacity onPress={() => handleRemoveMember(item.id)}>
          <Text style={{ color: "red", fontSize: 12 }}>Remove</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
  // --- END MODIFIED ---

  const renderContact = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleSelectContact(item)}
      style={{
        paddingVertical: 12,
        borderBottomColor: "#333",
        borderBottomWidth: 1,
        paddingHorizontal: 10,
      }}
    >
      <Text style={{ color: "#222", fontSize: 16, fontWeight: "bold" }}>{item.name}</Text>
      <Text style={{ color: "#666", fontSize: 14 }}>
        {item.phoneNumbers ? item.phoneNumbers.map((p) => p.number).join(", ") : ""}
        {item.emails && item.emails.length > 0 ? ` | ${item.emails.map(e => e.email).join(", ")}` : ""}
      </Text>
    </TouchableOpacity>
  );

  const BOTTOM_SECTION_HEIGHT = isAdmin ? 220 : 90;
  const SCROLLABLE_HEIGHT = SCREEN_HEIGHT - BOTTOM_SECTION_HEIGHT - 60;

  // If Clerk is still loading, render nothing
  if (isSignedIn === undefined) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#000" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1, padding: 20, paddingBottom: BOTTOM_SECTION_HEIGHT, paddingTop: 50 }}>
        {/* Back Button at the top */}
        <TouchableOpacity style={[styles.backButton, { top: 60 }]} onPress={() => router.replace('/home')}>
          <Text style={styles.backButtonText}>{'\u25C0'} Back</Text>
        </TouchableOpacity>

        {/* Group Name Header */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 5, marginTop: 45 }}>
          {editingDescription && isAdmin ? (
            <>
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: "#222",
                  color: "#FBDB58",
                  padding: 8,
                  borderRadius: 8,
                  fontSize: 22,
                  fontWeight: "bold",
                  marginRight: 8,
                }}
                value={newGroupName}
                onChangeText={setNewGroupName}
                placeholder="Group Name"
                placeholderTextColor="#888"
                maxLength={40}
              />
              <TouchableOpacity
                onPress={handleSaveDescription}
                style={{
                  backgroundColor: "#FBDB58",
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 8,
                  marginRight: 6,
                }}
              >
                <Text style={{ color: "#222", fontWeight: "bold" }}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setEditingDescription(false);
                  setNewDescription(group?.description || "");
                  setNewGroupName(group?.name || "");
                }}
                style={{
                  backgroundColor: "#333",
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: "#fff" }}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={{
                fontSize: 26,
                color: "#FBDB58",
                fontWeight: "bold",
                flex: 1,
              }}>
                {group?.name || "Group"}
              </Text>
              {/* Admin Delete Group Button */}
              {isAdmin && (
                <TouchableOpacity
                  onPress={handleDeleteGroup}
                  style={{
                    backgroundColor: "#FF3B30",
                    paddingVertical: 5,
                    paddingHorizontal: 5,
                    borderRadius: 8,
                    marginLeft: 10,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Delete Group</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Group Description Sub-heading */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
          {editingDescription && isAdmin ? (
            <>
              <TextInput
                style={{
                  flex: 1,
                  backgroundColor: "#222",
                  color: "#FFF",
                  padding: 8,
                  borderRadius: 8,
                  fontSize: 15,
                  marginRight: 8,
                }}
                value={newDescription}
                onChangeText={setNewDescription}
                placeholder="Enter group description"
                placeholderTextColor="#888"
                multiline
              />
            </>
          ) : (
            <>
              <Text style={{
                color: "#FFF",
                fontSize: 15,
                flex: 1,
                fontStyle: group?.description ? "normal" : "italic",
                opacity: group?.description ? 1 : 0.7,
              }}>
                {group?.description || "No description set."}
              </Text>
              {isAdmin && (
                <TouchableOpacity
                  onPress={() => {
                    setEditingDescription(true);
                    setNewDescription(group?.description || "");
                    setNewGroupName(group?.name || "");
                  }}
                  style={{
                    marginLeft: 10,
                    backgroundColor: "#FBDB58",
                    borderRadius: 6,
                    padding: 6,
                  }}
                >
                  <Text style={{ color: "#222", fontWeight: "bold" }}>Edit</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Scrollable area: search + members list */}
        <View style={{ flex: 1 }}>
          <TextInput
            placeholder="Search Members"
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
            style={{
              backgroundColor: "#222",
              color: "#FFF",
              padding: 10,
              borderRadius: 10,
              marginBottom: 10,
              marginTop: 5,
            }}
          />

          <FlatList
            data={filteredMembers}
            keyExtractor={(item) => item.id}
            renderItem={renderMember}
            showsVerticalScrollIndicator={true}
            style={{ maxHeight: SCROLLABLE_HEIGHT }}
          />
        </View>

        {/* Contacts Modal */}
        <Modal visible={contactsModalVisible} animationType="slide" transparent>
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
              padding: 20,
            }}
          >
            <View style={{ backgroundColor: "#FFF", borderRadius: 10, padding: 20, maxHeight: "80%" }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
                Select Contact to Add
              </Text>
              {/* Search bar and button for contacts */}
              <View style={{ flexDirection: "row", marginBottom: 10 }}>
                <TextInput
                  placeholder="Search contacts"
                  placeholderTextColor="#aaa"
                  value={contactsSearch}
                  onChangeText={setContactsSearch}
                  style={{
                    flex: 1,
                    backgroundColor: "#f2f2f2",
                    color: "#222",
                    padding: 8,
                    borderRadius: 8,
                    marginRight: 8,
                  }}
                  returnKeyType="search"
                  onSubmitEditing={handleContactsSearch}
                />
                <TouchableOpacity
                  onPress={handleContactsSearch}
                  style={{
                    backgroundColor: "#FBDB58",
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#222", fontWeight: "bold" }}>Search</Text>
                </TouchableOpacity>
              </View>
              {contactsLoading ? (
                <Text style={{ color: "#222", marginBottom: 10 }}>Loading contacts...</Text>
              ) : (
                <FlatList
                  data={filteredContacts}
                  keyExtractor={(item) => item.id}
                  renderItem={renderContact}
                  style={{ marginBottom: 10 }}
                  keyboardShouldPersistTaps="handled"
                />
              )}
              <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                <TouchableOpacity onPress={() => setContactsModalVisible(false)}>
                  <Text style={{ color: "gray", fontSize: 16 }}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>

      {/* Bottom section: Invite Members (if admin) */}
      <View style={[styles.bottomSection, { height: BOTTOM_SECTION_HEIGHT }]}>
        {isAdmin && (
          <View style={styles.inviteSection}>
            <Text style={{ color: "#FBDB58", fontSize: 18, fontWeight: "bold", marginBottom: 6 }}>
              Invite Members
            </Text>
            {/* Show group code instead of invite link */}
            <Text style={{ color: "#1E90FF", fontSize: 14, marginBottom: 10 }}>
              Group Code: {group?.joinCode}
            </Text>
            <TouchableOpacity
              onPress={handleCopyCode}
              style={{
                backgroundColor: "#FFCE00",
                padding: 10,
                borderRadius: 8,
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text style={{ color: "#000000", fontWeight: "bold" }}>
                Copy Group Code
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAddFromContacts}
              style={{
                backgroundColor: "#FBDB58",
                padding: 14,
                borderRadius: 10,
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text style={{ color: "#222", fontWeight: "bold" }}>
                Add Member from Phone Contacts
              </Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Sign out button removed */}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 60,
    left: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.0)',
    paddingVertical: 2,
    paddingHorizontal: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 18,
    left: 1,
    fontWeight: 'bold',
  },
  bottomSection: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#222",
    zIndex: 100,
    justifyContent: "flex-end",
  },
  inviteSection: {
    marginBottom: 40,
  },
  memberIconContainer: {
    width: 36,
    height: 36,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  memberIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
});

export default GroupMembers;