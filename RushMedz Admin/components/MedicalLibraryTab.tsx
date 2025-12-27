import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Linking,
} from 'react-native';

// Categories for medical encyclopedia
const CATEGORIES = [
  { id: 'diseases', name: 'Diseases & Conditions', icon: '🦠', color: '#E74C3C' },
  { id: 'medicines', name: 'Medicines', icon: '💊', color: '#3498DB' },
  { id: 'equipment', name: 'Medical Equipment', icon: '🩺', color: '#27AE60' },
  { id: 'terms', name: 'Medical Terms', icon: '📖', color: '#9B59B6' },
  { id: 'remedies', name: 'Home Remedies', icon: '🌿', color: '#F39C12' },
  { id: 'firstaid', name: 'First Aid', icon: '🏥', color: '#E91E63' },
];

// Comprehensive medical encyclopedia database
const MEDICAL_DATABASE = {
  diseases: [
    {
      id: 'd1',
      name: 'Diabetes Mellitus',
      category: 'Endocrine',
      description: 'A chronic metabolic disorder characterized by high blood sugar levels over a prolonged period.',
      symptoms: ['Frequent urination', 'Increased thirst', 'Unexplained weight loss', 'Fatigue', 'Blurred vision', 'Slow healing wounds'],
      causes: ['Genetic factors', 'Obesity', 'Sedentary lifestyle', 'Poor diet', 'Age'],
      treatments: ['Insulin therapy', 'Oral medications', 'Diet management', 'Regular exercise', 'Blood sugar monitoring'],
      prevention: ['Maintain healthy weight', 'Regular exercise', 'Balanced diet', 'Limit sugar intake', 'Regular check-ups'],
      whenToSeeDoctor: 'If you experience frequent urination, excessive thirst, unexplained weight loss, or fatigue.',
    },
    {
      id: 'd2',
      name: 'Hypertension (High Blood Pressure)',
      category: 'Cardiovascular',
      description: 'A condition in which blood pressure in the arteries is persistently elevated, increasing risk of heart disease and stroke.',
      symptoms: ['Often no symptoms (silent killer)', 'Headaches', 'Shortness of breath', 'Nosebleeds', 'Dizziness'],
      causes: ['Obesity', 'High salt intake', 'Stress', 'Smoking', 'Genetics', 'Age'],
      treatments: ['ACE inhibitors', 'Beta-blockers', 'Diuretics', 'Calcium channel blockers', 'Lifestyle changes'],
      prevention: ['Reduce salt intake', 'Exercise regularly', 'Maintain healthy weight', 'Limit alcohol', 'Manage stress'],
      whenToSeeDoctor: 'If your blood pressure reading is consistently above 140/90 mmHg.',
    },
    {
      id: 'd3',
      name: 'Dengue Fever',
      category: 'Infectious Disease',
      description: 'A mosquito-borne tropical disease caused by the dengue virus, common in the Philippines.',
      symptoms: ['High fever', 'Severe headache', 'Pain behind eyes', 'Muscle and joint pain', 'Rash', 'Mild bleeding'],
      causes: ['Aedes mosquito bite', 'Dengue virus infection'],
      treatments: ['Rest', 'Hydration', 'Paracetamol for fever', 'Avoid aspirin/ibuprofen', 'Medical monitoring'],
      prevention: ['Use mosquito repellent', 'Wear long sleeves', 'Eliminate standing water', 'Use mosquito nets'],
      whenToSeeDoctor: 'Immediately if you have high fever with warning signs like severe abdominal pain, persistent vomiting, or bleeding.',
    },
    {
      id: 'd4',
      name: 'Tuberculosis (TB)',
      category: 'Respiratory',
      description: 'A bacterial infection that primarily affects the lungs but can affect other parts of the body.',
      symptoms: ['Persistent cough (3+ weeks)', 'Coughing blood', 'Night sweats', 'Weight loss', 'Fever', 'Fatigue'],
      causes: ['Mycobacterium tuberculosis bacteria', 'Airborne transmission'],
      treatments: ['6-month antibiotic regimen', 'DOTS program', 'Regular monitoring'],
      prevention: ['BCG vaccination', 'Good ventilation', 'Cover mouth when coughing', 'Early treatment of infected individuals'],
      whenToSeeDoctor: 'If you have a persistent cough for more than 3 weeks, especially with blood or weight loss.',
    },
    {
      id: 'd5',
      name: 'Asthma',
      category: 'Respiratory',
      description: 'A chronic inflammatory disease of the airways causing recurring episodes of wheezing, breathlessness, and coughing.',
      symptoms: ['Wheezing', 'Shortness of breath', 'Chest tightness', 'Coughing (especially at night)', 'Difficulty breathing'],
      causes: ['Allergens', 'Respiratory infections', 'Exercise', 'Cold air', 'Air pollutants', 'Stress'],
      treatments: ['Inhaled corticosteroids', 'Bronchodilators', 'Rescue inhalers', 'Allergy medications', 'Immunotherapy'],
      prevention: ['Avoid triggers', 'Regular medication', 'Keep inhaler accessible', 'Monitor peak flow'],
      whenToSeeDoctor: 'If asthma symptoms worsen despite medication or if you need rescue inhaler frequently.',
    },
    {
      id: 'd6',
      name: 'Urinary Tract Infection (UTI)',
      category: 'Urological',
      description: 'An infection in any part of the urinary system, most commonly affecting the bladder and urethra.',
      symptoms: ['Burning sensation during urination', 'Frequent urination', 'Cloudy urine', 'Strong-smelling urine', 'Pelvic pain'],
      causes: ['Bacteria (E. coli)', 'Poor hygiene', 'Dehydration', 'Sexual activity', 'Holding urine too long'],
      treatments: ['Antibiotics', 'Increased fluid intake', 'Pain relievers', 'Cranberry supplements'],
      prevention: ['Drink plenty of water', 'Urinate after intercourse', 'Wipe front to back', 'Avoid irritating products'],
      whenToSeeDoctor: 'If symptoms persist for more than 2 days, or if you have fever, back pain, or blood in urine.',
    },
  ],
  medicines: [
    {
      id: 'm1',
      name: 'Paracetamol (Acetaminophen)',
      genericName: 'Paracetamol',
      brandNames: ['Biogesic', 'Tempra', 'Tylenol', 'Calpol'],
      category: 'Analgesic/Antipyretic',
      uses: ['Pain relief', 'Fever reduction', 'Headache', 'Minor aches'],
      dosage: 'Adults: 500-1000mg every 4-6 hours. Max 4g/day',
      sideEffects: ['Rare at normal doses', 'Liver damage with overdose', 'Allergic reactions'],
      contraindications: ['Liver disease', 'Alcohol dependence', 'Allergy to paracetamol'],
      warnings: ['Do not exceed recommended dose', 'Avoid alcohol', 'Check other medications for paracetamol'],
      prescription: false,
    },
    {
      id: 'm2',
      name: 'Amoxicillin',
      genericName: 'Amoxicillin',
      brandNames: ['Amoxil', 'Moxicil', 'Himox'],
      category: 'Antibiotic',
      uses: ['Bacterial infections', 'Respiratory infections', 'UTI', 'Skin infections', 'Ear infections'],
      dosage: 'Adults: 250-500mg every 8 hours for 7-14 days',
      sideEffects: ['Diarrhea', 'Nausea', 'Rash', 'Allergic reactions'],
      contraindications: ['Penicillin allergy', 'Mononucleosis'],
      warnings: ['Complete full course', 'May reduce birth control effectiveness', 'Take with food if stomach upset'],
      prescription: true,
    },
    {
      id: 'm3',
      name: 'Losartan',
      genericName: 'Losartan Potassium',
      brandNames: ['Cozaar', 'Lifezar', 'Loranta'],
      category: 'Antihypertensive (ARB)',
      uses: ['High blood pressure', 'Heart failure', 'Diabetic kidney disease', 'Stroke prevention'],
      dosage: 'Adults: 50-100mg once daily',
      sideEffects: ['Dizziness', 'Fatigue', 'Hyperkalemia', 'Cough (less common than ACE inhibitors)'],
      contraindications: ['Pregnancy', 'Severe liver disease', 'Bilateral renal artery stenosis'],
      warnings: ['Monitor potassium levels', 'Avoid salt substitutes', 'May cause dizziness initially'],
      prescription: true,
    },
    {
      id: 'm4',
      name: 'Metformin',
      genericName: 'Metformin Hydrochloride',
      brandNames: ['Glucophage', 'Diabetmin', 'Metforgamma'],
      category: 'Antidiabetic',
      uses: ['Type 2 diabetes', 'Insulin resistance', 'PCOS'],
      dosage: 'Adults: Start 500mg twice daily, max 2550mg/day',
      sideEffects: ['Gastrointestinal upset', 'Diarrhea', 'Nausea', 'Vitamin B12 deficiency'],
      contraindications: ['Kidney disease', 'Liver disease', 'Heart failure', 'Alcoholism'],
      warnings: ['Take with food', 'Stay hydrated', 'Stop before contrast procedures'],
      prescription: true,
    },
    {
      id: 'm5',
      name: 'Omeprazole',
      genericName: 'Omeprazole',
      brandNames: ['Losec', 'Prilosec', 'Omepron'],
      category: 'Proton Pump Inhibitor',
      uses: ['GERD', 'Gastric ulcers', 'H. pylori infection', 'Acid reflux'],
      dosage: 'Adults: 20-40mg once daily before breakfast',
      sideEffects: ['Headache', 'Diarrhea', 'Abdominal pain', 'Nausea', 'Vitamin B12 deficiency with long-term use'],
      contraindications: ['Allergy to PPIs'],
      warnings: ['Long-term use may affect bone health', 'May mask stomach cancer symptoms'],
      prescription: false,
    },
    {
      id: 'm6',
      name: 'Salbutamol',
      genericName: 'Salbutamol (Albuterol)',
      brandNames: ['Ventolin', 'Proventil', 'Airomir'],
      category: 'Bronchodilator',
      uses: ['Asthma relief', 'COPD', 'Bronchospasm', 'Exercise-induced asthma'],
      dosage: '1-2 puffs every 4-6 hours as needed',
      sideEffects: ['Tremor', 'Palpitations', 'Headache', 'Nervousness'],
      contraindications: ['Allergy to salbutamol'],
      warnings: ['Not for regular use without controller', 'Seek help if using more than 3 times/week'],
      prescription: true,
    },
  ],
  equipment: [
    {
      id: 'e1',
      name: 'Blood Pressure Monitor',
      category: 'Diagnostic',
      description: 'Device used to measure blood pressure, available in manual and automatic versions.',
      usage: ['Wrap cuff around upper arm', 'Rest 5 minutes before reading', 'Take reading at same time daily', 'Keep arm at heart level'],
      types: ['Digital automatic', 'Manual aneroid', 'Mercury (hospital use)'],
      maintenance: ['Calibrate annually', 'Store properly', 'Replace batteries regularly', 'Clean cuff periodically'],
      normalReading: 'Normal: <120/80 mmHg | Elevated: 120-129/<80 | High: ≥130/80',
      price: '₱800 - ₱3,500',
    },
    {
      id: 'e2',
      name: 'Glucometer',
      category: 'Diagnostic',
      description: 'Device used to measure blood glucose levels for diabetes management.',
      usage: ['Wash hands', 'Insert test strip', 'Prick finger with lancet', 'Apply blood drop to strip', 'Read result'],
      types: ['Standard glucometer', 'Continuous glucose monitor (CGM)', 'Flash glucose monitor'],
      maintenance: ['Store strips properly', 'Check expiration dates', 'Clean device regularly', 'Calibrate as instructed'],
      normalReading: 'Fasting: 70-100 mg/dL | After meals: <140 mg/dL',
      price: '₱500 - ₱5,000',
    },
    {
      id: 'e3',
      name: 'Nebulizer',
      category: 'Respiratory',
      description: 'Device that converts liquid medication into mist for inhalation, used for respiratory conditions.',
      usage: ['Attach mask or mouthpiece', 'Add prescribed medication', 'Turn on and breathe normally', 'Continue until mist stops'],
      types: ['Compressor nebulizer', 'Ultrasonic nebulizer', 'Mesh nebulizer'],
      maintenance: ['Clean after each use', 'Disinfect weekly', 'Replace filters', 'Air dry components'],
      normalReading: 'Treatment usually takes 10-15 minutes',
      price: '₱1,500 - ₱8,000',
    },
    {
      id: 'e4',
      name: 'Pulse Oximeter',
      category: 'Diagnostic',
      description: 'Device that measures oxygen saturation level (SpO2) and pulse rate through the fingertip.',
      usage: ['Place on fingertip', 'Wait 10-20 seconds', 'Read SpO2 and pulse', 'Remove nail polish for accurate reading'],
      types: ['Fingertip oximeter', 'Handheld oximeter', 'Wrist oximeter'],
      maintenance: ['Clean sensor regularly', 'Replace batteries', 'Store in cool dry place'],
      normalReading: 'Normal SpO2: 95-100% | Below 90% requires medical attention',
      price: '₱300 - ₱2,000',
    },
    {
      id: 'e5',
      name: 'Digital Thermometer',
      category: 'Diagnostic',
      description: 'Device used to measure body temperature accurately and quickly.',
      usage: ['Turn on device', 'Place under tongue/armpit/rectum', 'Wait for beep', 'Read temperature'],
      types: ['Oral/Axillary', 'Rectal', 'Ear (tympanic)', 'Forehead (temporal)'],
      maintenance: ['Clean before/after use', 'Replace batteries', 'Store properly'],
      normalReading: 'Oral: 36.1-37.2°C (97-99°F) | Fever: >37.8°C (100°F)',
      price: '₱150 - ₱1,500',
    },
    {
      id: 'e6',
      name: 'Wheelchair',
      category: 'Mobility Aid',
      description: 'Chair with wheels for individuals who have difficulty walking due to illness, injury, or disability.',
      usage: ['Lock brakes before transferring', 'Adjust footrests', 'Use seatbelt if available', 'Push from handles'],
      types: ['Manual standard', 'Lightweight', 'Transport', 'Electric/Power'],
      maintenance: ['Check tire pressure', 'Lubricate moving parts', 'Inspect brakes', 'Clean upholstery'],
      normalReading: 'N/A - Choose based on user needs and measurements',
      price: '₱3,000 - ₱80,000+',
    },
  ],
  terms: [
    {
      id: 't1',
      term: 'Hypertension',
      definition: 'Persistent elevation of blood pressure in the arteries above normal levels (≥140/90 mmHg).',
      relatedTerms: ['Systolic', 'Diastolic', 'Antihypertensive'],
      category: 'Cardiovascular',
    },
    {
      id: 't2',
      term: 'Tachycardia',
      definition: 'Abnormally rapid heart rate, typically defined as more than 100 beats per minute in adults.',
      relatedTerms: ['Bradycardia', 'Arrhythmia', 'Palpitations'],
      category: 'Cardiovascular',
    },
    {
      id: 't3',
      term: 'Antibiotic',
      definition: 'Medication used to treat bacterial infections by killing bacteria or inhibiting their growth.',
      relatedTerms: ['Antimicrobial', 'Resistance', 'Bactericidal', 'Bacteriostatic'],
      category: 'Pharmacology',
    },
    {
      id: 't4',
      term: 'Inflammation',
      definition: 'Body\'s protective response to injury or infection, characterized by redness, heat, swelling, and pain.',
      relatedTerms: ['Acute', 'Chronic', 'Anti-inflammatory'],
      category: 'Pathology',
    },
    {
      id: 't5',
      term: 'Biopsy',
      definition: 'Medical procedure involving removal of tissue sample for examination to diagnose disease.',
      relatedTerms: ['Histology', 'Pathology', 'Malignant', 'Benign'],
      category: 'Diagnostic',
    },
    {
      id: 't6',
      term: 'Prophylaxis',
      definition: 'Treatment or action taken to prevent disease from occurring.',
      relatedTerms: ['Prevention', 'Vaccination', 'Prophylactic'],
      category: 'Preventive Medicine',
    },
    {
      id: 't7',
      term: 'Prognosis',
      definition: 'Medical prediction of the likely course and outcome of a disease.',
      relatedTerms: ['Diagnosis', 'Outcome', 'Recovery'],
      category: 'Clinical',
    },
    {
      id: 't8',
      term: 'Hemoglobin',
      definition: 'Iron-containing protein in red blood cells that carries oxygen from lungs to body tissues.',
      relatedTerms: ['Anemia', 'Red blood cells', 'Oxygen saturation'],
      category: 'Hematology',
    },
  ],
  remedies: [
    {
      id: 'r1',
      name: 'Honey and Lemon for Sore Throat',
      condition: 'Sore Throat / Cough',
      ingredients: ['1 tbsp honey', '1 tbsp fresh lemon juice', '1 cup warm water'],
      instructions: ['Mix honey and lemon in warm water', 'Drink while warm', 'Repeat 2-3 times daily'],
      benefits: ['Soothes throat', 'Natural antibacterial', 'Vitamin C boost'],
      cautions: ['Not for children under 1 year (honey)', 'Diabetics should limit honey'],
      effectiveness: 'Mild to moderate relief',
    },
    {
      id: 'r2',
      name: 'Ginger Tea for Nausea',
      condition: 'Nausea / Motion Sickness',
      ingredients: ['Fresh ginger (1-inch)', 'Hot water', 'Honey (optional)'],
      instructions: ['Slice or grate ginger', 'Steep in hot water for 5-10 minutes', 'Strain and add honey if desired'],
      benefits: ['Anti-nausea properties', 'Aids digestion', 'Anti-inflammatory'],
      cautions: ['May interact with blood thinners', 'Avoid excessive amounts during pregnancy'],
      effectiveness: 'Well-studied for nausea relief',
    },
    {
      id: 'r3',
      name: 'Saltwater Gargle',
      condition: 'Sore Throat / Oral Health',
      ingredients: ['1/2 tsp salt', '1 cup warm water'],
      instructions: ['Dissolve salt in warm water', 'Gargle for 30 seconds', 'Spit out', 'Repeat 2-3 times daily'],
      benefits: ['Reduces inflammation', 'Kills bacteria', 'Loosens mucus'],
      cautions: ['Do not swallow', 'Not for young children'],
      effectiveness: 'Clinically supported for sore throat',
    },
    {
      id: 'r4',
      name: 'Turmeric Milk (Golden Milk)',
      condition: 'Inflammation / Immunity',
      ingredients: ['1 tsp turmeric powder', '1 cup warm milk', 'Pinch of black pepper', 'Honey to taste'],
      instructions: ['Heat milk', 'Add turmeric and pepper', 'Stir well', 'Add honey', 'Drink before bed'],
      benefits: ['Anti-inflammatory', 'Antioxidant', 'Immune support', 'Promotes sleep'],
      cautions: ['May stain teeth', 'Avoid with gallbladder issues', 'May interact with blood thinners'],
      effectiveness: 'Traditional remedy with modern research support',
    },
    {
      id: 'r5',
      name: 'Cold Compress for Headache',
      condition: 'Headache / Migraine',
      ingredients: ['Ice cubes or cold pack', 'Clean cloth or towel'],
      instructions: ['Wrap ice in cloth', 'Apply to forehead or back of neck', 'Keep for 15-20 minutes', 'Take breaks'],
      benefits: ['Constricts blood vessels', 'Numbs pain', 'Reduces inflammation'],
      cautions: ['Don\'t apply ice directly to skin', 'Not for circulation issues'],
      effectiveness: 'Effective for tension headaches and migraines',
    },
  ],
  firstaid: [
    {
      id: 'f1',
      name: 'Choking (Adult)',
      category: 'Emergency',
      steps: [
        '1. Ask "Are you choking?" If person can\'t speak, cough, or breathe:',
        '2. Stand behind the person',
        '3. Place fist above navel, below ribcage',
        '4. Grasp fist with other hand',
        '5. Give quick upward thrusts (Heimlich maneuver)',
        '6. Repeat until object is expelled or person becomes unconscious',
        '7. Call emergency services if unconscious'
      ],
      warnings: 'Different technique for pregnant women and infants. Call 911/117 if unresponsive.',
      supplies: 'None required',
    },
    {
      id: 'f2',
      name: 'Burns (Minor)',
      category: 'Injury',
      steps: [
        '1. Cool burn under running cool (not cold) water for 10-20 minutes',
        '2. Remove jewelry or tight items before swelling',
        '3. Don\'t break blisters',
        '4. Apply aloe vera or burn cream',
        '5. Cover with sterile non-stick bandage',
        '6. Take OTC pain reliever if needed'
      ],
      warnings: 'Seek medical help for burns larger than 3 inches, on face/hands/joints, or if skin is charred.',
      supplies: 'Cool water, burn cream, sterile bandage, pain reliever',
    },
    {
      id: 'f3',
      name: 'Cuts and Wounds',
      category: 'Injury',
      steps: [
        '1. Wash hands before treating',
        '2. Stop bleeding by applying gentle pressure with clean cloth',
        '3. Clean wound with clean water',
        '4. Apply antibiotic ointment',
        '5. Cover with sterile bandage',
        '6. Change bandage daily'
      ],
      warnings: 'Seek medical care for deep cuts, heavy bleeding, or signs of infection.',
      supplies: 'Clean cloth, antiseptic, antibiotic ointment, bandages',
    },
    {
      id: 'f4',
      name: 'Nosebleed',
      category: 'Bleeding',
      steps: [
        '1. Sit upright and lean slightly forward',
        '2. Pinch soft part of nose just below bony ridge',
        '3. Hold for 10-15 minutes without checking',
        '4. Apply cold compress to bridge of nose',
        '5. Avoid blowing nose for several hours'
      ],
      warnings: 'Seek help if bleeding lasts >20 minutes, follows head injury, or is very heavy.',
      supplies: 'Tissues, cold compress',
    },
    {
      id: 'f5',
      name: 'CPR (Adult)',
      category: 'Emergency',
      steps: [
        '1. Check responsiveness - tap and shout',
        '2. Call 911/117 or ask someone to call',
        '3. Check for breathing (look, listen, feel for 10 seconds)',
        '4. If not breathing normally, begin chest compressions',
        '5. Place heel of hand on center of chest',
        '6. Push hard and fast (2 inches deep, 100-120/min)',
        '7. Give 30 compressions, then 2 rescue breaths',
        '8. Continue until help arrives or person responds'
      ],
      warnings: 'Only perform if trained. Hands-only CPR is acceptable if untrained.',
      supplies: 'AED if available',
    },
  ],
};

interface SearchResult {
  id: string;
  name: string;
  type: 'disease' | 'medicine' | 'equipment' | 'term' | 'remedy' | 'firstaid';
  preview: string;
  data: any;
}

interface DetailModalProps {
  visible: boolean;
  item: SearchResult | null;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ visible, item, onClose }) => {
  if (!item) return null;

  const renderDiseaseContent = (data: any) => (
    <>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>📋 Description</Text>
        <Text style={styles.detailText}>{data.description}</Text>
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>🩺 Symptoms</Text>
        {data.symptoms.map((s: string, i: number) => (
          <Text key={i} style={styles.bulletPoint}>• {s}</Text>
        ))}
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>⚡ Causes</Text>
        {data.causes.map((c: string, i: number) => (
          <Text key={i} style={styles.bulletPoint}>• {c}</Text>
        ))}
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>💊 Treatments</Text>
        {data.treatments.map((t: string, i: number) => (
          <Text key={i} style={styles.bulletPoint}>• {t}</Text>
        ))}
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>🛡️ Prevention</Text>
        {data.prevention.map((p: string, i: number) => (
          <Text key={i} style={styles.bulletPoint}>• {p}</Text>
        ))}
      </View>
      <View style={[styles.detailSection, styles.alertBox]}>
        <Text style={styles.alertTitle}>⚠️ When to See a Doctor</Text>
        <Text style={styles.alertText}>{data.whenToSeeDoctor}</Text>
      </View>
    </>
  );

  const renderMedicineContent = (data: any) => (
    <>
      <View style={styles.detailSection}>
        <Text style={styles.detailLabel}>Generic Name:</Text>
        <Text style={styles.detailValue}>{data.genericName}</Text>
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailLabel}>Brand Names:</Text>
        <Text style={styles.detailValue}>{data.brandNames.join(', ')}</Text>
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailLabel}>Category:</Text>
        <Text style={styles.detailValue}>{data.category}</Text>
      </View>
      <View style={[styles.detailSection, data.prescription ? styles.prescriptionBadge : styles.otcBadge]}>
        <Text style={styles.badgeText}>{data.prescription ? '⚠️ Prescription Required' : '✅ Over-the-Counter'}</Text>
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>📌 Uses</Text>
        {data.uses.map((u: string, i: number) => (
          <Text key={i} style={styles.bulletPoint}>• {u}</Text>
        ))}
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>💊 Dosage</Text>
        <Text style={styles.detailText}>{data.dosage}</Text>
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>⚠️ Side Effects</Text>
        {data.sideEffects.map((s: string, i: number) => (
          <Text key={i} style={styles.bulletPoint}>• {s}</Text>
        ))}
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>🚫 Contraindications</Text>
        {data.contraindications.map((c: string, i: number) => (
          <Text key={i} style={styles.bulletPoint}>• {c}</Text>
        ))}
      </View>
      <View style={[styles.detailSection, styles.warningBox]}>
        <Text style={styles.warningTitle}>⚡ Important Warnings</Text>
        {data.warnings.map((w: string, i: number) => (
          <Text key={i} style={styles.warningText}>• {w}</Text>
        ))}
      </View>
    </>
  );

  const renderEquipmentContent = (data: any) => (
    <>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>📋 Description</Text>
        <Text style={styles.detailText}>{data.description}</Text>
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailLabel}>Category:</Text>
        <Text style={styles.detailValue}>{data.category}</Text>
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailLabel}>Price Range:</Text>
        <Text style={styles.detailValue}>{data.price}</Text>
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>📖 How to Use</Text>
        {data.usage.map((u: string, i: number) => (
          <Text key={i} style={styles.bulletPoint}>{i + 1}. {u}</Text>
        ))}
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>📦 Types Available</Text>
        {data.types.map((t: string, i: number) => (
          <Text key={i} style={styles.bulletPoint}>• {t}</Text>
        ))}
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>🔧 Maintenance</Text>
        {data.maintenance.map((m: string, i: number) => (
          <Text key={i} style={styles.bulletPoint}>• {m}</Text>
        ))}
      </View>
      <View style={[styles.detailSection, styles.infoBox]}>
        <Text style={styles.infoTitle}>📊 Normal Reading/Reference</Text>
        <Text style={styles.infoText}>{data.normalReading}</Text>
      </View>
    </>
  );

  const renderTermContent = (data: any) => (
    <>
      <View style={styles.detailSection}>
        <Text style={styles.detailLabel}>Category:</Text>
        <Text style={styles.detailValue}>{data.category}</Text>
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>📖 Definition</Text>
        <Text style={styles.detailText}>{data.definition}</Text>
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>🔗 Related Terms</Text>
        <View style={styles.tagsContainer}>
          {data.relatedTerms.map((t: string, i: number) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );

  const renderRemedyContent = (data: any) => (
    <>
      <View style={styles.detailSection}>
        <Text style={styles.detailLabel}>For:</Text>
        <Text style={styles.detailValue}>{data.condition}</Text>
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>🥣 Ingredients</Text>
        {data.ingredients.map((item: string, idx: number) => (
          <Text key={idx} style={styles.bulletPoint}>• {item}</Text>
        ))}
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>📝 Instructions</Text>
        {data.instructions.map((item: string, idx: number) => (
          <Text key={idx} style={styles.bulletPoint}>{idx + 1}. {item}</Text>
        ))}
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>✨ Benefits</Text>
        {data.benefits.map((b: string, i: number) => (
          <Text key={i} style={styles.bulletPoint}>• {b}</Text>
        ))}
      </View>
      <View style={[styles.detailSection, styles.cautionBox]}>
        <Text style={styles.cautionTitle}>⚠️ Cautions</Text>
        {data.cautions.map((c: string, i: number) => (
          <Text key={i} style={styles.cautionText}>• {c}</Text>
        ))}
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailLabel}>Effectiveness:</Text>
        <Text style={styles.detailValue}>{data.effectiveness}</Text>
      </View>
    </>
  );

  const renderFirstAidContent = (data: any) => (
    <>
      <View style={[styles.detailSection, styles.emergencyHeader]}>
        <Text style={styles.emergencyCategory}>{data.category.toUpperCase()}</Text>
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailSectionTitle}>📋 Steps</Text>
        {data.steps.map((s: string, i: number) => (
          <Text key={i} style={styles.stepText}>{s}</Text>
        ))}
      </View>
      <View style={[styles.detailSection, styles.warningBox]}>
        <Text style={styles.warningTitle}>⚠️ Important Warnings</Text>
        <Text style={styles.warningText}>{data.warnings}</Text>
      </View>
      <View style={styles.detailSection}>
        <Text style={styles.detailLabel}>Supplies Needed:</Text>
        <Text style={styles.detailValue}>{data.supplies}</Text>
      </View>
    </>
  );

  const getContent = () => {
    switch (item.type) {
      case 'disease': return renderDiseaseContent(item.data);
      case 'medicine': return renderMedicineContent(item.data);
      case 'equipment': return renderEquipmentContent(item.data);
      case 'term': return renderTermContent(item.data);
      case 'remedy': return renderRemedyContent(item.data);
      case 'firstaid': return renderFirstAidContent(item.data);
      default: return null;
    }
  };

  const getTypeIcon = () => {
    switch (item.type) {
      case 'disease': return '🦠';
      case 'medicine': return '💊';
      case 'equipment': return '🩺';
      case 'term': return '📖';
      case 'remedy': return '🌿';
      case 'firstaid': return '🏥';
      default: return '📋';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalIcon}>{getTypeIcon()}</Text>
            <Text style={styles.modalTitle}>{item.name}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            {getContent()}
          </ScrollView>
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              ⚠️ DISCLAIMER: This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical concerns.
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function MedicalLibraryTab() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedItem, setSelectedItem] = useState<SearchResult | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const searchDatabase = useCallback((searchQuery: string, category?: string) => {
    const q = searchQuery.toLowerCase().trim();
    const searchResults: SearchResult[] = [];

    // Helper to check if we should search this category
    const shouldSearch = (cat: string) => !category || category === cat;

    // Search diseases
    if (shouldSearch('diseases')) {
      MEDICAL_DATABASE.diseases.forEach(d => {
        if (!q || d.name.toLowerCase().includes(q) || 
            d.description.toLowerCase().includes(q) ||
            d.symptoms.some(s => s.toLowerCase().includes(q))) {
          searchResults.push({
            id: d.id,
            name: d.name,
            type: 'disease',
            preview: d.description.slice(0, 100) + '...',
            data: d,
          });
        }
      });
    }

    // Search medicines
    if (shouldSearch('medicines')) {
      MEDICAL_DATABASE.medicines.forEach(m => {
        if (!q || m.name.toLowerCase().includes(q) ||
            m.genericName.toLowerCase().includes(q) ||
            m.brandNames.some(b => b.toLowerCase().includes(q)) ||
            m.uses.some(u => u.toLowerCase().includes(q))) {
          searchResults.push({
            id: m.id,
            name: m.name,
            type: 'medicine',
            preview: `${m.category} - ${m.uses.slice(0, 2).join(', ')}`,
            data: m,
          });
        }
      });
    }

    // Search equipment
    if (shouldSearch('equipment')) {
      MEDICAL_DATABASE.equipment.forEach(e => {
        if (!q || e.name.toLowerCase().includes(q) ||
            e.description.toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q)) {
          searchResults.push({
            id: e.id,
            name: e.name,
            type: 'equipment',
            preview: e.description.slice(0, 100) + '...',
            data: e,
          });
        }
      });
    }

    // Search terms
    if (shouldSearch('terms')) {
      MEDICAL_DATABASE.terms.forEach(t => {
        if (!q || t.term.toLowerCase().includes(q) ||
            t.definition.toLowerCase().includes(q)) {
          searchResults.push({
            id: t.id,
            name: t.term,
            type: 'term',
            preview: t.definition.slice(0, 100) + '...',
            data: t,
          });
        }
      });
    }

    // Search remedies
    if (shouldSearch('remedies')) {
      MEDICAL_DATABASE.remedies.forEach(r => {
        if (!q || r.name.toLowerCase().includes(q) ||
            r.condition.toLowerCase().includes(q)) {
          searchResults.push({
            id: r.id,
            name: r.name,
            type: 'remedy',
            preview: `For: ${r.condition}`,
            data: r,
          });
        }
      });
    }

    // Search first aid
    if (shouldSearch('firstaid')) {
      MEDICAL_DATABASE.firstaid.forEach(f => {
        if (!q || f.name.toLowerCase().includes(q) ||
            f.category.toLowerCase().includes(q)) {
          searchResults.push({
            id: f.id,
            name: f.name,
            type: 'firstaid',
            preview: `${f.category} - ${f.steps[0]}`,
            data: f,
          });
        }
      });
    }

    return searchResults;
  }, []);

  const handleSearch = () => {
    if (query.trim()) {
      const searchResults = searchDatabase(query, activeCategory || undefined);
      setResults(searchResults);
    }
  };

  const handleCategoryPress = (categoryId: string) => {
    if (activeCategory === categoryId) {
      setActiveCategory(null);
      setResults([]);
    } else {
      setActiveCategory(categoryId);
      const items = searchDatabase(query, categoryId);
      setResults(items);
    }
  };

  const handleItemPress = (item: SearchResult) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'disease': return '#E74C3C';
      case 'medicine': return '#3498DB';
      case 'equipment': return '#27AE60';
      case 'term': return '#9B59B6';
      case 'remedy': return '#F39C12';
      case 'firstaid': return '#E91E63';
      default: return '#7F8C8D';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'disease': return '🦠';
      case 'medicine': return '💊';
      case 'equipment': return '🩺';
      case 'term': return '📖';
      case 'remedy': return '🌿';
      case 'firstaid': return '🏥';
      default: return '📋';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏥 Medical Encyclopedia</Text>
      <Text style={styles.subtitle}>Search diseases, medicines, equipment & more</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search diseases, medicines, symptoms..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContainer}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryChip,
              { backgroundColor: cat.color + '20', borderColor: cat.color },
              activeCategory === cat.id && { backgroundColor: cat.color },
            ]}
            onPress={() => handleCategoryPress(cat.id)}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={[
              styles.categoryText,
              activeCategory === cat.id && styles.categoryTextActive,
            ]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Results */}
      <ScrollView style={styles.resultsContainer}>
        {results.length === 0 && !query && !activeCategory && (
          <View style={styles.welcomeBox}>
            <Text style={styles.welcomeIcon}>📚</Text>
            <Text style={styles.welcomeTitle}>Welcome to Medical Library</Text>
            <Text style={styles.welcomeText}>
              Search for any medical term, disease, medicine, or browse by category to learn more.
            </Text>
            <View style={styles.quickTips}>
              <Text style={styles.tipsTitle}>Quick Search Tips:</Text>
              <Text style={styles.tipText}>• Search "fever" for related diseases</Text>
              <Text style={styles.tipText}>• Search "paracetamol" for medicine info</Text>
              <Text style={styles.tipText}>• Search "blood pressure" for equipment</Text>
              <Text style={styles.tipText}>• Tap categories to browse all items</Text>
            </View>
          </View>
        )}

        {results.length === 0 && (query || activeCategory) && (
          <View style={styles.noResults}>
            <Text style={styles.noResultsIcon}>🔍</Text>
            <Text style={styles.noResultsText}>No results found</Text>
            <Text style={styles.noResultsSubtext}>Try different keywords or browse categories</Text>
          </View>
        )}

        {results.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.resultCard}
            onPress={() => handleItemPress(item)}
          >
            <View style={[styles.typeIndicator, { backgroundColor: getTypeColor(item.type) }]}>
              <Text style={styles.typeIconText}>{getTypeIcon(item.type)}</Text>
            </View>
            <View style={styles.resultContent}>
              <Text style={styles.resultName}>{item.name}</Text>
              <Text style={styles.resultPreview} numberOfLines={2}>{item.preview}</Text>
              <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + '20' }]}>
                <Text style={[styles.typeBadgeText, { color: getTypeColor(item.type) }]}>
                  {item.type.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Disclaimer Banner */}
      <View style={styles.disclaimerBanner}>
        <Text style={styles.disclaimerBannerText}>
          ⚠️ For educational purposes only. Consult a doctor for medical advice.
        </Text>
      </View>

      {/* Detail Modal */}
      <DetailModal
        visible={showDetail}
        item={selectedItem}
        onClose={() => setShowDetail(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#7F8C8D', marginBottom: 16 },
  
  searchContainer: { flexDirection: 'row', marginBottom: 12 },
  searchInput: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 12, 
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  searchBtn: { 
    backgroundColor: '#3498DB', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    justifyContent: 'center',
    marginLeft: 8,
  },
  searchBtnText: { fontSize: 20 },

  categoriesScroll: { maxHeight: 50, marginBottom: 12 },
  categoriesContainer: { paddingRight: 16 },
  categoryChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20, 
    marginRight: 8,
    borderWidth: 1,
  },
  categoryIcon: { fontSize: 16, marginRight: 6 },
  categoryText: { fontSize: 12, fontWeight: '600', color: '#333' },
  categoryTextActive: { color: '#fff' },

  resultsContainer: { flex: 1 },
  resultCard: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  typeIndicator: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 12,
  },
  typeIconText: { fontSize: 20 },
  resultContent: { flex: 1 },
  resultName: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 4 },
  resultPreview: { fontSize: 13, color: '#7F8C8D', marginBottom: 6 },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  typeBadgeText: { fontSize: 10, fontWeight: 'bold' },
  chevron: { fontSize: 24, color: '#bbb', marginLeft: 8 },

  welcomeBox: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    padding: 24, 
    alignItems: 'center',
    marginTop: 20,
  },
  welcomeIcon: { fontSize: 48, marginBottom: 12 },
  welcomeTitle: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', marginBottom: 8 },
  welcomeText: { fontSize: 14, color: '#7F8C8D', textAlign: 'center', marginBottom: 16 },
  quickTips: { width: '100%', backgroundColor: '#F8F9FA', borderRadius: 8, padding: 12 },
  tipsTitle: { fontSize: 14, fontWeight: 'bold', color: '#2C3E50', marginBottom: 8 },
  tipText: { fontSize: 13, color: '#555', marginBottom: 4 },

  noResults: { alignItems: 'center', marginTop: 40 },
  noResultsIcon: { fontSize: 48, marginBottom: 12 },
  noResultsText: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50' },
  noResultsSubtext: { fontSize: 14, color: '#7F8C8D' },

  disclaimerBanner: { 
    backgroundColor: '#FEF5E7', 
    padding: 8, 
    borderRadius: 8, 
    marginTop: 8,
  },
  disclaimerBannerText: { fontSize: 11, color: '#B7950B', textAlign: 'center' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24, 
    maxHeight: '90%',
  },
  modalHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#eee',
  },
  modalIcon: { fontSize: 28, marginRight: 12 },
  modalTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#2C3E50' },
  closeBtn: { padding: 8 },
  closeBtnText: { fontSize: 20, color: '#999' },
  modalBody: { padding: 16 },

  detailSection: { marginBottom: 16 },
  detailSectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50', marginBottom: 8 },
  detailText: { fontSize: 14, color: '#333', lineHeight: 22 },
  detailLabel: { fontSize: 12, color: '#7F8C8D', marginBottom: 2 },
  detailValue: { fontSize: 15, color: '#2C3E50', fontWeight: '500' },
  bulletPoint: { fontSize: 14, color: '#333', marginBottom: 4, paddingLeft: 8 },
  stepText: { fontSize: 14, color: '#333', marginBottom: 6, lineHeight: 20 },

  alertBox: { backgroundColor: '#FDEDEC', padding: 12, borderRadius: 8 },
  alertTitle: { fontSize: 14, fontWeight: 'bold', color: '#E74C3C', marginBottom: 4 },
  alertText: { fontSize: 13, color: '#C0392B' },

  warningBox: { backgroundColor: '#FEF9E7', padding: 12, borderRadius: 8 },
  warningTitle: { fontSize: 14, fontWeight: 'bold', color: '#F39C12', marginBottom: 4 },
  warningText: { fontSize: 13, color: '#B7950B' },

  cautionBox: { backgroundColor: '#FDF2E9', padding: 12, borderRadius: 8 },
  cautionTitle: { fontSize: 14, fontWeight: 'bold', color: '#E67E22', marginBottom: 4 },
  cautionText: { fontSize: 13, color: '#AF601A' },

  infoBox: { backgroundColor: '#E8F8F5', padding: 12, borderRadius: 8 },
  infoTitle: { fontSize: 14, fontWeight: 'bold', color: '#27AE60', marginBottom: 4 },
  infoText: { fontSize: 13, color: '#1E8449' },

  prescriptionBadge: { backgroundColor: '#FDEDEC', padding: 8, borderRadius: 8, alignSelf: 'flex-start' },
  otcBadge: { backgroundColor: '#E8F8F5', padding: 8, borderRadius: 8, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontWeight: 'bold' },

  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { backgroundColor: '#EBF5FB', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8, marginBottom: 8 },
  tagText: { fontSize: 12, color: '#2980B9' },

  emergencyHeader: { backgroundColor: '#FADBD8', padding: 8, borderRadius: 8, alignSelf: 'flex-start' },
  emergencyCategory: { fontSize: 12, fontWeight: 'bold', color: '#C0392B' },

  disclaimer: { 
    backgroundColor: '#FCF3CF', 
    padding: 12, 
    borderBottomLeftRadius: 24, 
    borderBottomRightRadius: 24,
  },
  disclaimerText: { fontSize: 11, color: '#7D6608', textAlign: 'center', lineHeight: 16 },
});
