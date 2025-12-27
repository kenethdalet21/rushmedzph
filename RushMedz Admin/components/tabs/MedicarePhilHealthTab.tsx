import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  Alert,
  Modal,
} from 'react-native';

// PhilHealth official hotlines and contact numbers
const PHILHEALTH_CONTACTS = {
  actionCenter: {
    name: 'PhilHealth Action Center',
    number: '8441-7442',
    description: 'Main hotline for inquiries and complaints',
    tollFree: '1800-10-7442',
  },
  memberServices: {
    name: 'Member Services',
    number: '8441-7444',
    description: 'For membership verification and contributions',
  },
  textLine: {
    name: 'PhilHealth Text Line',
    number: '0917-898-7442',
    description: 'Send text inquiries',
  },
  email: 'actioncenter@philhealth.gov.ph',
  website: 'https://www.philhealth.gov.ph',
};

// PhilHealth Benefit Packages
const PHILHEALTH_BENEFITS = [
  {
    id: 'inpatient',
    title: 'Inpatient Benefits',
    icon: '🏥',
    description: 'Hospital confinement and medical procedures',
    coverage: [
      { item: 'Room and Board', amount: '₱800-₱1,100/day' },
      { item: 'Drugs and Medicines', amount: 'Up to ₱10,000' },
      { item: 'X-ray/Lab/Others', amount: 'Up to ₱3,500' },
      { item: 'Operating Room', amount: 'Up to ₱4,000' },
      { item: 'Professional Fees', amount: 'Up to ₱5,000' },
    ],
  },
  {
    id: 'outpatient',
    title: 'Outpatient Benefits',
    icon: '🩺',
    description: 'Day surgeries and procedures without confinement',
    coverage: [
      { item: 'Primary Care Consultation', amount: '₱500/visit' },
      { item: 'Dialysis', amount: '₱2,600/session' },
      { item: 'Chemotherapy', amount: 'Up to ₱50,000' },
      { item: 'Radiotherapy', amount: 'Up to ₱30,000' },
      { item: 'Outpatient Blood Transfusion', amount: '₱1,700' },
    ],
  },
  {
    id: 'maternity',
    title: 'Maternity Care Package',
    icon: '🤰',
    description: 'Pre-natal, delivery, and post-natal care',
    coverage: [
      { item: 'Normal Spontaneous Delivery', amount: '₱9,000' },
      { item: 'Cesarean Section', amount: '₱19,000' },
      { item: 'Pre-natal Care (4 visits)', amount: '₱1,500' },
      { item: 'Post-natal Care', amount: '₱1,000' },
      { item: 'Newborn Care Package', amount: '₱1,750' },
    ],
  },
  {
    id: 'covid',
    title: 'COVID-19 Benefits',
    icon: '🦠',
    description: 'Testing, treatment, and hospitalization',
    coverage: [
      { item: 'Mild COVID-19', amount: '₱43,997' },
      { item: 'Moderate COVID-19', amount: '₱143,267' },
      { item: 'Severe COVID-19', amount: '₱333,519' },
      { item: 'Critical COVID-19', amount: '₱786,384' },
      { item: 'RT-PCR Testing', amount: '₱4,000' },
    ],
  },
  {
    id: 'zbenefits',
    title: 'Z Benefits',
    icon: '💎',
    description: 'Catastrophic illness packages',
    coverage: [
      { item: 'Breast Cancer', amount: 'Up to ₱100,000' },
      { item: 'Prostate Cancer', amount: 'Up to ₱100,000' },
      { item: 'Kidney Transplant', amount: '₱600,000' },
      { item: 'Coronary Artery Bypass', amount: '₱550,000' },
      { item: 'Leukemia (Children)', amount: '₱210,000' },
    ],
  },
  {
    id: 'preventive',
    title: 'Preventive Care',
    icon: '🛡️',
    description: 'Wellness and prevention services',
    coverage: [
      { item: 'Annual Physical Exam', amount: '₱1,500' },
      { item: 'Flu Vaccination', amount: 'Free' },
      { item: 'Pneumococcal Vaccine', amount: 'Free' },
      { item: 'TB-DOTS', amount: 'Covered' },
      { item: 'Animal Bite Treatment', amount: 'Covered' },
    ],
  },
];

// Member Contribution Table
const CONTRIBUTION_TABLE = [
  { monthlyIncome: '₱10,000 & below', rate: '₱400/month' },
  { monthlyIncome: '₱10,001 - ₱59,999.99', rate: '4% of income' },
  { monthlyIncome: '₱60,000 - ₱79,999.99', rate: '₱2,400/month' },
  { monthlyIncome: '₱80,000 & above', rate: '₱3,200/month' },
];

// Regional Offices
const REGIONAL_OFFICES = [
  { region: 'NCR', phone: '(02) 8441-7442', address: 'Citystate Centre, Shaw Blvd., Pasig City' },
  { region: 'Region I', phone: '(072) 607-0752', address: 'San Fernando City, La Union' },
  { region: 'Region II', phone: '(078) 846-1614', address: 'Tuguegarao City, Cagayan' },
  { region: 'Region III', phone: '(045) 455-1888', address: 'San Fernando City, Pampanga' },
  { region: 'Region IV-A', phone: '(02) 8551-2040', address: 'Calamba City, Laguna' },
  { region: 'Region V', phone: '(052) 481-5050', address: 'Legazpi City, Albay' },
  { region: 'Region VI', phone: '(033) 337-5596', address: 'Iloilo City' },
  { region: 'Region VII', phone: '(032) 505-9595', address: 'Cebu City' },
  { region: 'Region VIII', phone: '(053) 323-3345', address: 'Tacloban City, Leyte' },
  { region: 'Region IX', phone: '(062) 993-0585', address: 'Zamboanga City' },
  { region: 'Region X', phone: '(088) 857-1781', address: 'Cagayan de Oro City' },
  { region: 'Region XI', phone: '(082) 221-7371', address: 'Davao City' },
  { region: 'Region XII', phone: '(083) 228-1100', address: 'Koronadal City' },
  { region: 'CARAGA', phone: '(085) 815-0294', address: 'Butuan City' },
  { region: 'CAR', phone: '(074) 442-0491', address: 'Baguio City' },
];

interface BenefitDetailModalProps {
  visible: boolean;
  benefit: typeof PHILHEALTH_BENEFITS[0] | null;
  onClose: () => void;
}

const BenefitDetailModal: React.FC<BenefitDetailModalProps> = ({ visible, benefit, onClose }) => {
  if (!benefit) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalIcon}>{benefit.icon}</Text>
            <Text style={styles.modalTitle}>{benefit.title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.modalDescription}>{benefit.description}</Text>
          <ScrollView style={styles.coverageList}>
            <Text style={styles.coverageHeader}>Coverage Details:</Text>
            {benefit.coverage.map((item, idx) => (
              <View key={idx} style={styles.coverageRow}>
                <Text style={styles.coverageItem}>{item.item}</Text>
                <Text style={styles.coverageAmount}>{item.amount}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              ⚠️ Coverage amounts may vary. Please verify with PhilHealth for the latest rates and requirements.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function MedicarePhilHealthTab() {
  const [activeSection, setActiveSection] = useState<'benefits' | 'contacts' | 'contributions' | 'offices'>('benefits');
  const [selectedBenefit, setSelectedBenefit] = useState<typeof PHILHEALTH_BENEFITS[0] | null>(null);
  const [showBenefitModal, setShowBenefitModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [philhealthId, setPhilhealthId] = useState('');

  const handleCall = (number: string) => {
    const phoneUrl = `tel:${number.replace(/[^0-9+]/g, '')}`;
    Linking.canOpenURL(phoneUrl)
      .then(supported => {
        if (supported) {
          Linking.openURL(phoneUrl);
        } else {
          Alert.alert('Unable to Call', `Please dial ${number} manually.`);
        }
      })
      .catch(() => Alert.alert('Error', 'Failed to initiate call'));
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${PHILHEALTH_CONTACTS.email}`);
  };

  const handleWebsite = () => {
    Linking.openURL(PHILHEALTH_CONTACTS.website);
  };

  const handleVerifyMembership = () => {
    if (!philhealthId.trim()) {
      Alert.alert('Required', 'Please enter your PhilHealth ID Number');
      return;
    }
    // Open PhilHealth member portal
    Linking.openURL('https://memberinquiry.philhealth.gov.ph/');
  };

  const filteredBenefits = PHILHEALTH_BENEFITS.filter(benefit =>
    benefit.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    benefit.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    benefit.coverage.some(c => c.item.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openBenefitDetail = (benefit: typeof PHILHEALTH_BENEFITS[0]) => {
    setSelectedBenefit(benefit);
    setShowBenefitModal(true);
  };

  const renderSectionTabs = () => (
    <View style={styles.sectionTabs}>
      {[
        { id: 'benefits', label: 'Benefits', icon: '💊' },
        { id: 'contacts', label: 'Hotlines', icon: '📞' },
        { id: 'contributions', label: 'Rates', icon: '💰' },
        { id: 'offices', label: 'Offices', icon: '🏢' },
      ].map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.sectionTab, activeSection === tab.id && styles.sectionTabActive]}
          onPress={() => setActiveSection(tab.id as any)}
        >
          <Text style={styles.sectionTabIcon}>{tab.icon}</Text>
          <Text style={[styles.sectionTabText, activeSection === tab.id && styles.sectionTabTextActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBenefitsSection = () => (
    <ScrollView style={styles.scrollContent}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search benefits, procedures..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.membershipBox}>
        <Text style={styles.membershipTitle}>🆔 Verify Your Membership</Text>
        <TextInput
          style={styles.idInput}
          placeholder="Enter PhilHealth ID Number (12 digits)"
          value={philhealthId}
          onChangeText={setPhilhealthId}
          keyboardType="numeric"
          maxLength={12}
        />
        <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyMembership}>
          <Text style={styles.verifyBtnText}>Check Status Online</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>PhilHealth Benefit Packages</Text>
      {filteredBenefits.map(benefit => (
        <TouchableOpacity
          key={benefit.id}
          style={styles.benefitCard}
          onPress={() => openBenefitDetail(benefit)}
        >
          <View style={styles.benefitHeader}>
            <Text style={styles.benefitIcon}>{benefit.icon}</Text>
            <View style={styles.benefitInfo}>
              <Text style={styles.benefitTitle}>{benefit.title}</Text>
              <Text style={styles.benefitDesc}>{benefit.description}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
          <View style={styles.benefitPreview}>
            {benefit.coverage.slice(0, 2).map((item, idx) => (
              <View key={idx} style={styles.previewRow}>
                <Text style={styles.previewItem}>• {item.item}</Text>
                <Text style={styles.previewAmount}>{item.amount}</Text>
              </View>
            ))}
            <Text style={styles.viewMore}>Tap to view all {benefit.coverage.length} items →</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderContactsSection = () => (
    <ScrollView style={styles.scrollContent}>
      <View style={styles.emergencyCard}>
        <Text style={styles.emergencyTitle}>📞 PhilHealth Action Center</Text>
        <Text style={styles.emergencySubtitle}>24/7 Hotline for Inquiries & Complaints</Text>
        
        <TouchableOpacity style={styles.callButton} onPress={() => handleCall(PHILHEALTH_CONTACTS.actionCenter.number)}>
          <Text style={styles.callButtonIcon}>📱</Text>
          <View style={styles.callButtonInfo}>
            <Text style={styles.callButtonNumber}>{PHILHEALTH_CONTACTS.actionCenter.number}</Text>
            <Text style={styles.callButtonLabel}>Metro Manila</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.callButton} onPress={() => handleCall(PHILHEALTH_CONTACTS.actionCenter.tollFree)}>
          <Text style={styles.callButtonIcon}>☎️</Text>
          <View style={styles.callButtonInfo}>
            <Text style={styles.callButtonNumber}>{PHILHEALTH_CONTACTS.actionCenter.tollFree}</Text>
            <Text style={styles.callButtonLabel}>Toll-Free (Provincial)</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>📧 Email Support</Text>
        <TouchableOpacity style={styles.contactRow} onPress={handleEmail}>
          <Text style={styles.contactValue}>{PHILHEALTH_CONTACTS.email}</Text>
          <Text style={styles.contactAction}>Send Email →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>📱 Text Inquiry</Text>
        <TouchableOpacity style={styles.contactRow} onPress={() => handleCall(PHILHEALTH_CONTACTS.textLine.number)}>
          <Text style={styles.contactValue}>{PHILHEALTH_CONTACTS.textLine.number}</Text>
          <Text style={styles.contactAction}>Send SMS →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.contactCard}>
        <Text style={styles.contactTitle}>🌐 Official Website</Text>
        <TouchableOpacity style={styles.contactRow} onPress={handleWebsite}>
          <Text style={styles.contactValue}>{PHILHEALTH_CONTACTS.website}</Text>
          <Text style={styles.contactAction}>Visit →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickLinks}>
        <Text style={styles.quickLinksTitle}>Quick Links</Text>
        <TouchableOpacity
          style={styles.quickLinkBtn}
          onPress={() => Linking.openURL('https://memberinquiry.philhealth.gov.ph/')}
        >
          <Text style={styles.quickLinkText}>🔍 Check Membership Status</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickLinkBtn}
          onPress={() => Linking.openURL('https://eregister.philhealth.gov.ph/')}
        >
          <Text style={styles.quickLinkText}>📝 Online Registration</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickLinkBtn}
          onPress={() => Linking.openURL('https://www.philhealth.gov.ph/about_us/transparency/')}
        >
          <Text style={styles.quickLinkText}>📊 Contribution Calculator</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderContributionsSection = () => (
    <ScrollView style={styles.scrollContent}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>💰 2024 Contribution Rate</Text>
        <Text style={styles.infoText}>
          The premium contribution rate is <Text style={styles.highlight}>4% of monthly basic salary</Text> for employed members, equally shared by employer and employee (2% each).
        </Text>
      </View>

      <Text style={styles.sectionHeader}>Contribution Schedule</Text>
      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableHeaderText}>Monthly Income</Text>
          <Text style={styles.tableHeaderText}>Premium Rate</Text>
        </View>
        {CONTRIBUTION_TABLE.map((row, idx) => (
          <View key={idx} style={[styles.tableRow, idx % 2 === 0 && styles.tableRowAlt]}>
            <Text style={styles.tableCell}>{row.monthlyIncome}</Text>
            <Text style={styles.tableCellBold}>{row.rate}</Text>
          </View>
        ))}
      </View>

      <View style={styles.memberTypeCard}>
        <Text style={styles.memberTypeTitle}>👥 Member Categories</Text>
        
        <View style={styles.memberType}>
          <Text style={styles.memberTypeIcon}>👔</Text>
          <View style={styles.memberTypeInfo}>
            <Text style={styles.memberTypeName}>Employed Members</Text>
            <Text style={styles.memberTypeDesc}>Premium shared 50-50 with employer</Text>
          </View>
        </View>

        <View style={styles.memberType}>
          <Text style={styles.memberTypeIcon}>💼</Text>
          <View style={styles.memberTypeInfo}>
            <Text style={styles.memberTypeName}>Self-Employed/Voluntary</Text>
            <Text style={styles.memberTypeDesc}>Pay full premium (₱400-₱3,200/month)</Text>
          </View>
        </View>

        <View style={styles.memberType}>
          <Text style={styles.memberTypeIcon}>🏠</Text>
          <View style={styles.memberTypeInfo}>
            <Text style={styles.memberTypeName}>Indigent Members</Text>
            <Text style={styles.memberTypeDesc}>Subsidized by LGU or National Government</Text>
          </View>
        </View>

        <View style={styles.memberType}>
          <Text style={styles.memberTypeIcon}>👴</Text>
          <View style={styles.memberTypeInfo}>
            <Text style={styles.memberTypeName}>Senior Citizens</Text>
            <Text style={styles.memberTypeDesc}>Automatic coverage under Special Laws</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderOfficesSection = () => (
    <ScrollView style={styles.scrollContent}>
      <Text style={styles.sectionHeader}>PhilHealth Regional Offices</Text>
      {REGIONAL_OFFICES.map((office, idx) => (
        <View key={idx} style={styles.officeCard}>
          <View style={styles.officeHeader}>
            <Text style={styles.officeRegion}>{office.region}</Text>
            <TouchableOpacity
              style={styles.callOfficeBtn}
              onPress={() => handleCall(office.phone)}
            >
              <Text style={styles.callOfficeBtnText}>📞 Call</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.officePhone}>{office.phone}</Text>
          <Text style={styles.officeAddress}>📍 {office.address}</Text>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🏥</Text>
        <Text style={styles.headerTitle}>Medicare / PhilHealth</Text>
      </View>
      
      {renderSectionTabs()}
      
      {activeSection === 'benefits' && renderBenefitsSection()}
      {activeSection === 'contacts' && renderContactsSection()}
      {activeSection === 'contributions' && renderContributionsSection()}
      {activeSection === 'offices' && renderOfficesSection()}

      <BenefitDetailModal
        visible={showBenefitModal}
        benefit={selectedBenefit}
        onClose={() => setShowBenefitModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8E44AD',
    padding: 16,
    paddingTop: 20,
  },
  headerIcon: { fontSize: 28, marginRight: 12 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  
  sectionTabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  sectionTabActive: { backgroundColor: '#8E44AD' },
  sectionTabIcon: { fontSize: 20, marginBottom: 4 },
  sectionTabText: { fontSize: 12, color: '#666' },
  sectionTabTextActive: { color: '#fff', fontWeight: 'bold' },

  scrollContent: { flex: 1, padding: 16 },
  
  searchContainer: { marginBottom: 16 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  membershipBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  membershipTitle: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32', marginBottom: 12 },
  idInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  verifyBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  verifyBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 12, marginTop: 8 },

  benefitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  benefitHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  benefitIcon: { fontSize: 36, marginRight: 12 },
  benefitInfo: { flex: 1 },
  benefitTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  benefitDesc: { fontSize: 13, color: '#666', marginTop: 2 },
  chevron: { fontSize: 24, color: '#999' },
  benefitPreview: { backgroundColor: '#F8F9FA', borderRadius: 8, padding: 12 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  previewItem: { fontSize: 13, color: '#555' },
  previewAmount: { fontSize: 13, fontWeight: 'bold', color: '#8E44AD' },
  viewMore: { fontSize: 12, color: '#8E44AD', marginTop: 8, fontStyle: 'italic' },

  emergencyCard: {
    backgroundColor: '#E74C3C',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  emergencyTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  emergencySubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.9)', marginBottom: 16 },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  callButtonIcon: { fontSize: 24, marginRight: 12 },
  callButtonInfo: { flex: 1 },
  callButtonNumber: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  callButtonLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },

  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  contactTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactValue: { fontSize: 14, color: '#555' },
  contactAction: { fontSize: 14, color: '#8E44AD', fontWeight: 'bold' },

  quickLinks: { marginTop: 8 },
  quickLinksTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  quickLinkBtn: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#8E44AD',
  },
  quickLinkText: { fontSize: 14, color: '#333' },

  infoCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#E65100', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#555', lineHeight: 20 },
  highlight: { fontWeight: 'bold', color: '#E65100' },

  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#8E44AD',
    padding: 12,
  },
  tableHeaderText: { flex: 1, color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  tableRow: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tableRowAlt: { backgroundColor: '#F8F9FA' },
  tableCell: { flex: 1, fontSize: 14, color: '#555', textAlign: 'center' },
  tableCellBold: { flex: 1, fontSize: 14, fontWeight: 'bold', color: '#333', textAlign: 'center' },

  memberTypeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  memberTypeTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  memberType: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  memberTypeIcon: { fontSize: 28, marginRight: 12 },
  memberTypeInfo: { flex: 1 },
  memberTypeName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  memberTypeDesc: { fontSize: 12, color: '#666', marginTop: 2 },

  officeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  officeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  officeRegion: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  callOfficeBtn: {
    backgroundColor: '#8E44AD',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  callOfficeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  officePhone: { fontSize: 14, color: '#8E44AD', marginBottom: 4 },
  officeAddress: { fontSize: 13, color: '#666' },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIcon: { fontSize: 40, marginRight: 12 },
  modalTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#333' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: 18, color: '#666' },
  modalDescription: { fontSize: 14, color: '#666', marginBottom: 16 },
  coverageList: { maxHeight: 300 },
  coverageHeader: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  coverageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  coverageItem: { flex: 1, fontSize: 14, color: '#555' },
  coverageAmount: { fontSize: 14, fontWeight: 'bold', color: '#8E44AD' },
  disclaimerBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  disclaimerText: { fontSize: 12, color: '#856404' },
});
