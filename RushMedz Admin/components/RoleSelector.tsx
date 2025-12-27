import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface RoleSelectorProps {
  onRoleSelect: (role: string) => void;
}

export default function RoleSelector({ onRoleSelect }: RoleSelectorProps) {
  const roles = [
    { id: 'admin', title: 'Admin Dashboard', color: '#FF6B6B', icon: '⚙️' },
    { id: 'merchant', title: 'Merchant App', color: '#4ECDC4', icon: '🏪' },
    { id: 'doctor', title: 'Doctor App', color: '#27AE60', icon: '👨‍⚕️' },
    { id: 'driver', title: 'Driver App', color: '#45B7D1', icon: '🚗' },
    { id: 'user', title: 'Customer App', color: '#96CEB4', icon: '👤' }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery Platform</Text>
      <Text style={styles.subtitle}>Select Your Role</Text>
      
      <View style={styles.roleGrid}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={[styles.roleCard, { backgroundColor: role.color }]}
            onPress={() => onRoleSelect(role.id)}
          >
            <Text style={styles.roleIcon}>{role.icon}</Text>
            <Text style={styles.roleTitle}>{role.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2C3E50',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#7F8C8D',
    marginBottom: 40,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  roleCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  roleIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});