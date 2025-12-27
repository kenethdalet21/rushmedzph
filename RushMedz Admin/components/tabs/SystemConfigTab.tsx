import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Switch, Alert, TouchableOpacity, TextInput, Modal } from 'react-native';
import { useAdminData } from '../../contexts/AdminDataContext';

interface SystemConfig {
  id: number;
  category: string;
  key: string;
  value: string;
  enabled: boolean;
  editable: boolean;
}

export default function SystemConfigTab({ onNavigateToTab }: { onNavigateToTab?: (tab: string) => void }) {
  const adminData = useAdminData();
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showMerchantModal, setShowMerchantModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [newMerchantName, setNewMerchantName] = useState('');
  const [newMerchantEmail, setNewMerchantEmail] = useState('');
  const [newMerchantPhone, setNewMerchantPhone] = useState('');
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverEmail, setNewDriverEmail] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverVehicle, setNewDriverVehicle] = useState('');
  const [merchantSearchQuery, setMerchantSearchQuery] = useState('');
  const [driverSearchQuery, setDriverSearchQuery] = useState('');

  const merchants = adminData?.merchants || [];
  const drivers = adminData?.drivers || [];

  // Filter merchants based on search query
  const filteredMerchants = merchants.filter(merchant => 
    merchant.name.toLowerCase().includes(merchantSearchQuery.toLowerCase()) ||
    merchant.location.toLowerCase().includes(merchantSearchQuery.toLowerCase()) ||
    merchant.contact.toLowerCase().includes(merchantSearchQuery.toLowerCase())
  );

  // Filter drivers based on search query
  const filteredDrivers = drivers.filter(driver => 
    driver.name.toLowerCase().includes(driverSearchQuery.toLowerCase()) ||
    driver.vehicleType.toLowerCase().includes(driverSearchQuery.toLowerCase()) ||
    driver.currentLocation.toLowerCase().includes(driverSearchQuery.toLowerCase())
  );

  useEffect(() => {
    setTimeout(() => {
      setConfigs([
        { id: 1, category: '💰 Pricing', key: 'Base Delivery Fee', value: '₱50.00', enabled: true, editable: true },
        { id: 2, category: '💰 Pricing', key: 'Per KM Charge', value: '₱15.00', enabled: true, editable: true },
        { id: 3, category: '💰 Pricing', key: 'Merchant Commission', value: '15%', enabled: true, editable: true },
        { id: 4, category: '💰 Pricing', key: 'Driver Commission', value: '80%', enabled: true, editable: true },
        { id: 5, category: '⚙️ Features', key: 'Enable Cash Payment', value: 'Yes', enabled: true, editable: false },
        { id: 6, category: '⚙️ Features', key: 'Enable Real-time Tracking', value: 'Yes', enabled: true, editable: false },
        { id: 7, category: '⚙️ Features', key: 'Enable Push Notifications', value: 'Yes', enabled: true, editable: false },
        { id: 8, category: '⚙️ Features', key: 'Enable Wallet System', value: 'Yes', enabled: true, editable: false },
        { id: 9, category: '🕐 Operations', key: 'Operating Hours Start', value: '08:00 AM', enabled: true, editable: true },
        { id: 10, category: '🕐 Operations', key: 'Operating Hours End', value: '10:00 PM', enabled: true, editable: true },
        { id: 11, category: '🕐 Operations', key: 'Max Delivery Time', value: '60 min', enabled: true, editable: true },
        { id: 12, category: '📍 Service', key: 'Service Area Radius', value: '10 km', enabled: true, editable: true },
        { id: 13, category: '📍 Service', key: 'Minimum Order Amount', value: '₱200.00', enabled: true, editable: true },
      ]);
      setLoading(false);
    }, 750);
  }, []);

  const handleToggleConfig = async (id: number, newValue: boolean) => {
    setConfigs(configs.map(c => c.id === id ? { ...c, enabled: newValue } : c));
    Alert.alert('Success', 'Configuration updated');
  };

  const handleEditConfig = (id: number, currentValue: string) => {
    setEditingId(id);
    setEditValue(currentValue);
  };

  const handleSaveConfig = (id: number) => {
    setConfigs(configs.map(c => c.id === id ? { ...c, value: editValue } : c));
    setEditingId(null);
    Alert.alert('Success', 'Configuration value updated');
  };

  const handleAddMerchant = async () => {
    if (!newMerchantName || !newMerchantEmail || !newMerchantPhone) {
      Alert.alert('Error', 'Please fill in all merchant fields');
      return;
    }
    
    const newMerchant = {
      name: newMerchantName,
      sales: 0,
      status: 'active' as const,
      location: 'To be assigned',
      rating: 5.0,
      totalOrders: 0,
      contact: newMerchantPhone,
    };

    await adminData?.addMerchant?.(newMerchant);
    setShowMerchantModal(false);
    setNewMerchantName('');
    setNewMerchantEmail('');
    setNewMerchantPhone('');
    Alert.alert('Success', 'Merchant registered successfully');
  };

  const handleRemoveMerchant = (merchantId: number) => {
    Alert.alert(
      'Confirm Removal',
      'Are you sure you want to remove this merchant?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await adminData?.removeMerchant?.(merchantId);
            Alert.alert('Success', 'Merchant removed successfully');
          },
        },
      ]
    );
  };

  const handleSuspendMerchant = (merchantId: number, currentStatus: string) => {
    const isSuspended = currentStatus === 'inactive';
    const newStatus = isSuspended ? 'active' : 'inactive';
    const action = isSuspended ? 'Activate' : 'Suspend';
    
    Alert.alert(
      `Confirm ${action}`,
      `Are you sure you want to ${action.toLowerCase()} this merchant?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          style: isSuspended ? 'default' : 'destructive',
          onPress: async () => {
            // Update merchant status through context
            await adminData?.updateMerchantStatus?.(merchantId, newStatus as 'active' | 'inactive' | 'pending');
            Alert.alert('Success', `Merchant ${action.toLowerCase()}d successfully`);
          },
        },
      ]
    );
  };

  const handleAddDriver = async () => {
    if (!newDriverName || !newDriverEmail || !newDriverPhone || !newDriverVehicle) {
      Alert.alert('Error', 'Please fill in all driver fields');
      return;
    }
    
    const newDriver = {
      name: newDriverName,
      deliveries: 0,
      status: 'online' as const,
      rating: 5.0,
      currentLocation: 'Available',
      earnings: 0,
      vehicleType: newDriverVehicle,
    };

    await adminData?.addDriver?.(newDriver);
    setShowDriverModal(false);
    setNewDriverName('');
    setNewDriverEmail('');
    setNewDriverPhone('');
    setNewDriverVehicle('');
    Alert.alert('Success', 'Driver registered successfully');
  };

  const handleRemoveDriver = (driverId: number) => {
    Alert.alert(
      'Confirm Removal',
      'Are you sure you want to remove this driver?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await adminData?.removeDriver?.(driverId);
            Alert.alert('Success', 'Driver removed successfully');
          },
        },
      ]
    );
  };

  const handleSuspendDriver = (driverId: number, currentStatus: string) => {
    const isSuspended = currentStatus === 'offline';
    const newStatus = isSuspended ? 'online' : 'offline';
    const action = isSuspended ? 'Activate' : 'Suspend';
    
    Alert.alert(
      `Confirm ${action}`,
      `Are you sure you want to ${action.toLowerCase()} this driver?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action,
          style: isSuspended ? 'default' : 'destructive',
          onPress: async () => {
            // Update driver status in the context
            const updatedDrivers = drivers.map(d => 
              d.id === driverId ? { ...d, status: newStatus as 'online' | 'offline' | 'delivering' } : d
            );
            // Trigger refresh to update UI
            await adminData?.refreshDrivers?.();
            Alert.alert('Success', `Driver ${action.toLowerCase()}d successfully`);
          },
        },
      ]
    );
  };

  if (loading) {
    return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading configuration...</Text>
      </View>
    );
  }

    const categories = Array.from(new Set(configs.map(c => c.category)));

  return (
      <ScrollView style={styles.container}>
      <Text style={styles.title}>System Configuration</Text>
      
        {categories.map((category) => (
          <View key={category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category}</Text>
            {configs.filter(c => c.category === category).map((item) => (
              <View key={item.id} style={styles.configCard}>
                <View style={styles.configHeader}>
                  <Text style={styles.configKey}>{item.key}</Text>
                  <Switch
                    value={item.enabled}
                    onValueChange={(newValue) => handleToggleConfig(item.id, newValue)}
                    trackColor={{ false: '#BDC3C7', true: '#2ECC71' }}
                    thumbColor={item.enabled ? '#FFF' : '#f4f3f4'}
                  />
                </View>
              
                {editingId === item.id ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={styles.editInput}
                      value={editValue}
                      onChangeText={setEditValue}
                    />
                    <View style={styles.editButtons}>
                      <TouchableOpacity 
                        style={[styles.editButton, { backgroundColor: '#2ECC71' }]}
                        onPress={() => handleSaveConfig(item.id)}
                      >
                        <Text style={styles.editButtonText}>✓ Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.editButton, { backgroundColor: '#E74C3C' }]}
                        onPress={() => setEditingId(null)}
                      >
                        <Text style={styles.editButtonText}>✕ Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.valueContainer}>
                    <Text style={styles.configValue}>{item.value}</Text>
                    {item.editable && (
                      <TouchableOpacity 
                        style={styles.editIconButton}
                        onPress={() => handleEditConfig(item.id, item.value)}
                      >
                        <Text style={styles.editIcon}>✏️</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
            </View>
            ))}
          </View>
        ))}

        {/* Merchant Management Section */}
        <View style={styles.categorySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.categoryTitle}>🏪 Merchant Management</Text>
            <TouchableOpacity 
              style={styles.viewDetailsButton}
              onPress={() => onNavigateToTab?.('merchant-management')}
            >
              <Text style={styles.viewDetailsButtonText}>View All →</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowMerchantModal(true)}
          >
            <Text style={styles.addButtonText}>➕ Register New Merchant</Text>
          </TouchableOpacity>
          
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Search merchants by name, location, or contact..."
            value={merchantSearchQuery}
            onChangeText={setMerchantSearchQuery}
            placeholderTextColor="#95A5A6"
          />
          
          {filteredMerchants.length === 0 && merchantSearchQuery !== '' ? (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No merchants found matching "{merchantSearchQuery}"</Text>
            </View>
          ) : null}
          
          {filteredMerchants.map((merchant) => (
            <View key={merchant.id} style={styles.entityCard}>
              <View style={styles.entityHeader}>
                <View style={styles.entityInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={styles.entityName}>{merchant.name}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: merchant.status === 'inactive' ? '#E74C3C' : merchant.status === 'active' ? '#2ECC71' : '#F39C12' }
                    ]}>
                      <Text style={styles.statusBadgeText}>
                        {merchant.status === 'inactive' ? '⏸ Suspended' : merchant.status === 'active' ? '✓ Active' : '⏳ Pending'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.entityDetail}>📍 {merchant.location}</Text>
                  <Text style={styles.entityDetail}>📞 {merchant.contact}</Text>
                  <Text style={styles.entityDetail}>⭐ {merchant.rating} | 📦 {merchant.totalOrders} orders</Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemoveMerchant(merchant.id)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.suspendButton,
                      { backgroundColor: merchant.status === 'inactive' ? '#2ECC71' : '#F39C12' }
                    ]}
                    onPress={() => handleSuspendMerchant(merchant.id, merchant.status)}
                  >
                    <Text style={styles.suspendButtonText}>
                      {merchant.status === 'inactive' ? '✓' : '⏸'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Driver Management Section */}
        <View style={styles.categorySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.categoryTitle}>🚚 Driver Management</Text>
            <TouchableOpacity 
              style={styles.viewDetailsButton}
              onPress={() => onNavigateToTab?.('driver-management')}
            >
              <Text style={styles.viewDetailsButtonText}>View All →</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setShowDriverModal(true)}
          >
            <Text style={styles.addButtonText}>➕ Register New Driver</Text>
          </TouchableOpacity>
          
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Search drivers by name, vehicle, or location..."
            value={driverSearchQuery}
            onChangeText={setDriverSearchQuery}
            placeholderTextColor="#95A5A6"
          />
          
          {filteredDrivers.length === 0 && driverSearchQuery !== '' ? (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No drivers found matching "{driverSearchQuery}"</Text>
            </View>
          ) : null}
          
          {filteredDrivers.map((driver) => (
            <View key={driver.id} style={styles.entityCard}>
              <View style={styles.entityHeader}>
                <View style={styles.entityInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={styles.entityName}>{driver.name}</Text>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: driver.status === 'offline' ? '#E74C3C' : driver.status === 'online' ? '#2ECC71' : '#3498DB' }
                    ]}>
                      <Text style={styles.statusBadgeText}>
                        {driver.status === 'offline' ? '⏸ Suspended' : driver.status === 'online' ? '✓ Active' : '🚚 Delivering'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.entityDetail}>🚗 {driver.vehicleType}</Text>
                  <Text style={styles.entityDetail}>📍 {driver.currentLocation}</Text>
                  <Text style={styles.entityDetail}>⭐ {driver.rating} | 📦 {driver.deliveries} deliveries</Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.removeButton}
                    onPress={() => handleRemoveDriver(driver.id)}
                  >
                    <Text style={styles.removeButtonText}>✕</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.suspendButton,
                      { backgroundColor: driver.status === 'offline' ? '#2ECC71' : '#F39C12' }
                    ]}
                    onPress={() => handleSuspendDriver(driver.id, driver.status)}
                  >
                    <Text style={styles.suspendButtonText}>
                      {driver.status === 'offline' ? '✓' : '⏸'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.saveAllButton}>
          <Text style={styles.saveAllButtonText}>💾 Save All Changes</Text>
        </TouchableOpacity>

        {/* Merchant Registration Modal */}
        <Modal
          visible={showMerchantModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowMerchantModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Register New Merchant</Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Merchant Name"
                value={newMerchantName}
                onChangeText={setNewMerchantName}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Email"
                value={newMerchantEmail}
                onChangeText={setNewMerchantEmail}
                keyboardType="email-address"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Phone Number"
                value={newMerchantPhone}
                onChangeText={setNewMerchantPhone}
                keyboardType="phone-pad"
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#E74C3C' }]}
                  onPress={() => {
                    setShowMerchantModal(false);
                    setNewMerchantName('');
                    setNewMerchantEmail('');
                    setNewMerchantPhone('');
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#2ECC71' }]}
                  onPress={handleAddMerchant}
                >
                  <Text style={styles.modalButtonText}>Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Driver Registration Modal */}
        <Modal
          visible={showDriverModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowDriverModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Register New Driver</Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Driver Name"
                value={newDriverName}
                onChangeText={setNewDriverName}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Email"
                value={newDriverEmail}
                onChangeText={setNewDriverEmail}
                keyboardType="email-address"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Phone Number"
                value={newDriverPhone}
                onChangeText={setNewDriverPhone}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.modalInput}
                placeholder="Vehicle Type (e.g., Motorcycle, Car)"
                value={newDriverVehicle}
                onChangeText={setNewDriverVehicle}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#E74C3C' }]}
                  onPress={() => {
                    setShowDriverModal(false);
                    setNewDriverName('');
                    setNewDriverEmail('');
                    setNewDriverPhone('');
                    setNewDriverVehicle('');
                  }}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#2ECC71' }]}
                  onPress={handleAddDriver}
                >
                  <Text style={styles.modalButtonText}>Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7F8C8D',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewDetailsButton: {
    backgroundColor: '#3498DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewDetailsButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  configCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  configHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  configKey: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    flex: 1,
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  configValue: {
    fontSize: 16,
    color: '#3498DB',
    fontWeight: '600',
  },
  editIconButton: {
    padding: 8,
  },
  editIcon: {
    fontSize: 20,
  },
  editContainer: {
    marginTop: 8,
  },
  editInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 8,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveAllButton: {
    backgroundColor: '#3498DB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  saveAllButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  entityCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    elevation: 2,
  },
  entityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  entityInfo: {
    flex: 1,
  },
  entityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 6,
  },
  entityDetail: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 3,
  },
  removeButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#2C3E50',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  searchInput: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#2C3E50',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 1,
  },
  noResultsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 1,
  },
  noResultsText: {
    fontSize: 14,
    color: '#95A5A6',
    fontStyle: 'italic',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 8,
  },
  suspendButton: {
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suspendButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
