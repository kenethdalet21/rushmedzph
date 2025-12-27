import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Modal, Pressable, StyleSheet } from 'react-native';

interface UserHamburgerMenuProps {
  onLocateClinic?: () => void;
  onSearchSpecialist?: () => void;
  onConnectCoverage?: () => void;
  onOnlineConsult?: () => void;
  onOpenMedicalLibrary?: () => void;
}

export default function UserHamburgerMenu({
  onLocateClinic,
  onSearchSpecialist,
  onConnectCoverage,
  onOnlineConsult,
  onOpenMedicalLibrary,
}: UserHamburgerMenuProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  const handle = (cb?: () => void) => {
    setMenuVisible(false);
    cb?.();
  };

  return (
    <>
      <View style={styles.buttonWrapper}>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.hamburgerButton}>
          <Text style={styles.hamburgerIcon}>☰</Text>
        </TouchableOpacity>
      </View>
      <Modal
        visible={menuVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)} />
        <View style={styles.menuModal}>
          <Text style={styles.menuTitle}>Health Services</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => handle(onLocateClinic)}>
            <Text style={styles.menuItemText}>Locate a doctor or clinic</Text>
            <Text style={styles.menuSubtext}>Find nearby providers registered by merchants</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handle(onSearchSpecialist)}>
            <Text style={styles.menuItemText}>Search specialized doctor</Text>
            <Text style={styles.menuSubtext}>See specialty, rates, and online consult availability</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handle(onConnectCoverage)}>
            <Text style={styles.menuItemText}>Connect with Medicare or PhilHealth</Text>
            <Text style={styles.menuSubtext}>Link coverage for faster verification</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handle(onOnlineConsult)}>
            <Text style={styles.menuItemText}>Online Medical Consultation</Text>
            <Text style={styles.menuSubtext}>Chat or video consult with a doctor</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => handle(onOpenMedicalLibrary)}>
            <Text style={styles.menuItemText}>Medical Library</Text>
            <Text style={styles.menuSubtext}>Browse terms, medicines, equipment, and Q&A</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  buttonWrapper: {
    paddingLeft: 8,
  },
  hamburgerButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#FFF',
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    width: 42,
    height: 42,
  },
  hamburgerIcon: {
    fontSize: 28,
    color: '#2C3E50',
  },
  menuModal: {
    position: 'absolute',
    top: 70,
    right: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    elevation: 8,
    minWidth: 230,
    zIndex: 100,
    alignItems: 'stretch',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2C3E50',
    textAlign: 'center',
  },
  menuItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  menuItemText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '600',
  },
  menuSubtext: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 99,
  },
});
