<template>
  <div class="doctors-tab">
    <div class="tab-header">
      <h2>Doctor Management</h2>
      <div class="filters">
        <select v-model="statusFilter">
          <option value="">All</option>
          <option value="ACTIVE">Active</option>
          <option value="PENDING">Pending Verification</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>
    </div>

    <div class="doctors-list">
      <div v-if="loading" class="loading">Loading doctors...</div>
      <div v-else class="grid">
        <div v-for="doctor in filteredDoctors" :key="doctor.id" class="doctor-card">
          <div class="card-header">
            <div class="doctor-info">
              <h3>{{ doctor.fullName }}</h3>
              <p class="specialization">{{ doctor.specialization }}</p>
            </div>
            <span :class="`badge ${doctor.status.toLowerCase()}`">{{ doctor.status }}</span>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="label">📧 Email:</span>
              <span>{{ doctor.email }}</span>
            </div>
            <div class="info-row">
              <span class="label">📞 Phone:</span>
              <span>{{ doctor.phoneNumber }}</span>
            </div>
            <div class="info-row">
              <span class="label">🏥 Hospital:</span>
              <span>{{ doctor.hospitalAffiliation }}</span>
            </div>
            <div class="info-row">
              <span class="label">📜 License:</span>
              <span>{{ doctor.licenseNumber }}</span>
            </div>
            <div class="info-row">
              <span class="label">💰 Fee:</span>
              <span class="highlight">{{ formatCurrency(doctor.consultationFee) }}</span>
            </div>
            <div class="info-row">
              <span class="label">⭐ Rating:</span>
              <span class="highlight">{{ doctor.rating }}/5.0 ({{ doctor.totalConsultations }} consultations)</span>
            </div>
          </div>
          <div class="card-actions">
            <button v-if="doctor.status === 'PENDING'" @click="approve(doctor.id)" class="btn-approve">
              Verify & Approve
            </button>
            <button v-if="doctor.status === 'ACTIVE'" @click="suspend(doctor.id)" class="btn-suspend">
              Suspend
            </button>
            <button v-if="doctor.status === 'SUSPENDED'" @click="unsuspend(doctor.id)" class="btn-approve">
              Unsuspend
            </button>
            <button @click="viewDetails(doctor.id)" class="btn-view">
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAdmin } from '../../composables/useAdmin';

const { getDoctors, approveDoctor, suspendDoctor, loading } = useAdmin();

const doctors = ref<any[]>([]);
const statusFilter = ref('');

const filteredDoctors = computed(() => {
  if (!statusFilter.value) return doctors.value;
  return doctors.value.filter(d => d.status === statusFilter.value);
});

const formatCurrency = (amount: number) => {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
};

const approve = async (doctorId: number) => {
  try {
    await approveDoctor(doctorId);
    const doctor = doctors.value.find(d => d.id === doctorId);
    if (doctor) doctor.status = 'ACTIVE';
    alert('Doctor verified and approved successfully!');
  } catch (error) {
    alert('Failed to approve doctor');
  }
};

const suspend = async (doctorId: number) => {
  if (confirm('Are you sure you want to suspend this doctor?')) {
    try {
      await suspendDoctor(doctorId);
      const doctor = doctors.value.find(d => d.id === doctorId);
      if (doctor) doctor.status = 'SUSPENDED';
      alert('Doctor suspended successfully!');
    } catch (error) {
      alert('Failed to suspend doctor');
    }
  }
};

const unsuspend = async (doctorId: number) => {
  if (confirm('Are you sure you want to unsuspend this doctor?')) {
    try {
      await approveDoctor(doctorId); // Reuse approve function to unsuspend
      const doctor = doctors.value.find(d => d.id === doctorId);
      if (doctor) doctor.status = 'ACTIVE';
      alert('Doctor unsuspended successfully!');
    } catch (error) {
      alert('Failed to unsuspend doctor');
    }
  }
};

const viewDetails = (doctorId: number) => {
  alert(`View details for Doctor #${doctorId}`);
};

onMounted(async () => {
  try {
    doctors.value = await getDoctors();
  } catch (error) {
    console.error('Failed to load doctors:', error);
    // Mock data
    doctors.value = [
      { id: 1, fullName: 'Dr. Maria Santos', specialization: 'General Physician', email: 'maria.santos@medic.com', phoneNumber: '+63 912 555 1111', hospitalAffiliation: 'Manila General Hospital', licenseNumber: 'PRC-123456', consultationFee: 500, rating: 4.8, totalConsultations: 342, status: 'ACTIVE' },
      { id: 2, fullName: 'Dr. Jose Reyes', specialization: 'Cardiologist', email: 'jose.reyes@medic.com', phoneNumber: '+63 923 555 2222', hospitalAffiliation: 'Heart Center', licenseNumber: 'PRC-234567', consultationFee: 1000, rating: 4.9, totalConsultations: 215, status: 'ACTIVE' },
      { id: 3, fullName: 'Dr. Ana Cruz', specialization: 'Pediatrician', email: 'ana.cruz@medic.com', phoneNumber: '+63 934 555 3333', hospitalAffiliation: 'Children\'s Hospital', licenseNumber: 'PRC-345678', consultationFee: 600, rating: 0, totalConsultations: 0, status: 'PENDING' },
      { id: 4, fullName: 'Dr. Roberto Garcia', specialization: 'Dermatologist', email: 'roberto.garcia@medic.com', phoneNumber: '+63 945 555 4444', hospitalAffiliation: 'Skin Clinic Manila', licenseNumber: 'PRC-456789', consultationFee: 800, rating: 4.7, totalConsultations: 189, status: 'ACTIVE' },
    ];
  }
});
</script>

<style scoped>
.doctors-tab {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
}

.tab-header {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 16px;
  text-align: center;
}

.tab-header h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: #2c3e50;
  letter-spacing: -0.5px;
  text-align: center;
  width: 100%;
}

.filters select {
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #2d3748;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filters select:hover {
  border-color: #cbd5e0;
}

.filters select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.doctors-list .grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
}

.doctor-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.doctor-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
  border-color: #e8ecef;
}

.card-header {
  padding: 24px;
  background: linear-gradient(180deg, #f8f9fa 0%, #f1f3f5 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 12px;
  border-bottom: 1px solid #e8ecef;
}

.doctor-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #333;
}

.specialization {
  margin: 0;
  font-size: 14px;
  color: #667eea;
  font-weight: 600;
}

.badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.badge.active {
  background: #d4edda;
  color: #155724;
}

.badge.pending {
  background: #fff3cd;
  color: #856404;
}

.badge.suspended {
  background: #f8d7da;
  color: #721c24;
}

.card-body {
  padding: 24px;
  text-align: center;
}

.info-row {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 14px;
  font-size: 14px;
  line-height: 1.5;
  gap: 4px;
  text-align: center;
}

.info-row .label {
  color: #718096;
  min-width: 120px;
  font-weight: 500;
  white-space: nowrap;
}

.info-row .highlight {
  font-weight: 600;
  color: #667eea;
  white-space: nowrap;
}

.card-actions {
  padding: 16px 20px;
  background: #f8f9fa;
  display: flex;
  gap: 8px;
}

.card-actions button {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-approve {
  background: #27ae60;
  color: white;
}

.btn-approve:hover {
  background: #229954;
}

.btn-suspend {
  background: #e74c3c;
  color: white;
}

.btn-suspend:hover {
  background: #c0392b;
}

.btn-view {
  background: #667eea;
  color: white;
}

.btn-view:hover {
  background: #5568d3;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}
</style>
