import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, TextInput, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function DeleteAccountButton() {
  const { deleteAccount, userProfile, loading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This will permanently delete your account and ALL your data including:\n\n• Profile information\n• Medical records\n• Appointments\n• Emergency requests\n• All personal data\n\nThis action CANNOT be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () => setShowModal(true)
        }
      ]
    );
  };

  const confirmDeletion = async () => {
    if (!userProfile?.email) {
      Alert.alert('Error', 'Unable to verify email address');
      return;
    }

    if (confirmationEmail.toLowerCase() !== userProfile.email.toLowerCase()) {
      Alert.alert('Error', 'Email confirmation does not match your account email');
      return;
    }

    try {
      setDeleting(true);
      
      Alert.alert(
        'Final Confirmation',
        'Are you absolutely sure you want to delete your account? This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setDeleting(false) },
          {
            text: 'Delete Forever',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteAccount();
                
                Alert.alert(
                  'Account Deleted',
                  'Your account and all associated data have been permanently deleted.',
                  [{ text: 'OK' }]
                );
                
                setShowModal(false);
                setConfirmationEmail('');
              } catch (error: any) {
                Alert.alert('Deletion Failed', error.message);
              } finally {
                setDeleting(false);
              }
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setDeleting(false);
    }
  };

  return (
    <>
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={handleDeleteAccount}
        disabled={loading}
      >
        <Text style={styles.deleteButtonText}>🗑️ Delete Account Permanently</Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚠️ Confirm Account Deletion</Text>
            
            <Text style={styles.modalText}>
              To confirm deletion, please type your email address:
            </Text>
            
            <Text style={styles.emailText}>{userProfile?.email}</Text>
            
            <TextInput
              style={styles.confirmationInput}
              value={confirmationEmail}
              onChangeText={setConfirmationEmail}
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!deleting}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowModal(false);
                  setConfirmationEmail('');
                }}
                disabled={deleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.confirmDeleteButton,
                  (deleting || !confirmationEmail) && styles.disabledButton
                ]}
                onPress={confirmDeletion}
                disabled={deleting || !confirmationEmail}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmDeleteText}>Delete Forever</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  deleteButton: {
    backgroundColor: '#f44336',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#d32f2f',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    width: '90%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f44336',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196f3',
    textAlign: 'center',
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  confirmationInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fafafa',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmDeleteButton: {
    flex: 1,
    backgroundColor: '#f44336',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.5,
    elevation: 0,
  },
  confirmDeleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
