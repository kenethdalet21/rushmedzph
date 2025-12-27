import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Modal, Pressable, StyleSheet } from 'react-native';

interface AdminHamburgerMenuProps {
  onNavigateToTab?: (tabId: string) => void;
}

export default function AdminHamburgerMenu({ onNavigateToTab }: AdminHamburgerMenuProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 8 }}>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.hamburgerButton}>
          <Text style={{ fontSize: 28, color: '#2C3E50' }}>☰</Text>
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
          <Text style={styles.menuTitle}>Quick Menu</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); onNavigateToTab && onNavigateToTab('sales-analytics'); }}>
            <Text style={styles.menuItemText}>Sales</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); onNavigateToTab && onNavigateToTab('order-management'); }}>
            <Text style={styles.menuItemText}>Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); onNavigateToTab && onNavigateToTab('payments'); }}>
            <Text style={styles.menuItemText}>Payments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); onNavigateToTab && onNavigateToTab('wallet-top-ups'); }}>
            <Text style={styles.menuItemText}>Wallet Top Ups</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  hamburgerButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#FFF',
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    marginRight: 4,
  },
  menuModal: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    elevation: 8,
    minWidth: 180,
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
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  menuItemText: {
    fontSize: 16,
    color: '#2C3E50',
    textAlign: 'left',
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
