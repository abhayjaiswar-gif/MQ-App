<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import WidgetFive from './components/WidgetFive.vue';
import SocialMediaHub from './components/SocialMediaHub.vue';
import RaiseTicketCard from './components/RaiseTicketCard.vue';
import StudentHighlights from './components/StudentHighlights.vue';
import MiniCalendar from './components/MiniCalendar.vue';
import FeedbackSection from './components/FeedbackSection.vue';
import UserLoginStatusModal from '@/components/modals/UserLoginStatusModal.vue';
import AssignedUserLoginStatusModal from '@/components/modals/AssignedUserLoginStatusModal.vue';
import PTMDateModal from '@/components/modals/PTMDateModal.vue';

const authStore = useAuthStore();
const showBirthdayModal = ref(false);
const showLoginStatusModal = ref(false);
const showAssignedLoginStatusModal = ref(false);
const showPtmModal = ref(false);
const birthdayDate = ref('');
const isSubmitting = ref(false);

const triggerLoginModal = () => {
  const userRoleId = authStore.user?.role_id || sessionStorage.getItem('role_id');
  
  if (userRoleId == '3') {
    const assignedLoginModalShown = sessionStorage.getItem('assigned_login_status_modal_shown');
    if (!assignedLoginModalShown) {
      showAssignedLoginStatusModal.value = true;
      sessionStorage.setItem('assigned_login_status_modal_shown', 'true');
    }
  } else {
    const loginModalShown = sessionStorage.getItem('login_status_modal_shown');
    if (!loginModalShown) {
      showLoginStatusModal.value = true;
      sessionStorage.setItem('login_status_modal_shown', 'true');
    }
  }
};

const triggerPtmModal = () => {
  const userRoleId = authStore.user?.role_id || sessionStorage.getItem('role_id');
  
  // Principal Role is 8
  if (userRoleId == '8') {
    const ptmModalShown = sessionStorage.getItem('ptm_modal_shown');
    if (!ptmModalShown) {
      showPtmModal.value = true;
      sessionStorage.setItem('ptm_modal_shown', 'true');
      return; // Stop here, wait for PTM modal to close before showing login modal
    }
  }
  
  // If not principal, or already shown, move to next in queue
  triggerLoginModal();
};

onMounted(async () => {
  // Check if user is logged in and has an ID
  const userId = authStore.user?.id || sessionStorage.getItem('id');

  if (userId) {
    try {
      const response = await fetch(`/api/user-birthday/${userId}`);
      const data = await response.json();
      if (data.success && !data.hasBirthday) {
        showBirthdayModal.value = true;
      } else {
        triggerPtmModal();
      }
    } catch (error) {
      console.error('Error checking birthday:', error);
      triggerPtmModal();
    }
  } else {
    triggerPtmModal();
  }
});

const saveBirthday = async () => {
  const userId = authStore.user?.id || sessionStorage.getItem('id');
  if (!birthdayDate.value || !userId) return;
  
  isSubmitting.value = true;
  try {
    const response = await fetch('/api/user-birthday', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        birthdayDate: birthdayDate.value
      })
    });
    const data = await response.json();
    if (data.success) {
      showBirthdayModal.value = false;
      // Trigger next modal in queue
      triggerPtmModal();
    }
  } catch (error) {
    console.error('Error saving birthday:', error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>
<template>
  <v-row class="mb-0">
    <v-col cols="12">
      <WidgetFive />
    </v-col>
  </v-row>

  <v-row>
    <!-- 🚀 MAIN CONTENT STREAM (Left Column) -->
    <v-col cols="12" md="8" class="space-y-6">
      <!-- Social Media & Activity Hub -->
      <SocialMediaHub />
      
      <!-- Students Highlight Swiper -->
      <StudentHighlights />
    </v-col>

    <!-- 📊 SIDEBAR CONTENT (Right Column) -->
    <v-col cols="12" md="4" class="space-y-6">
      <!-- Support & Ticketing -->
      <RaiseTicketCard />

      <!-- Miniature Academy Calendar -->
      <MiniCalendar />

      <!-- Feedback Section -->
      <FeedbackSection />
    </v-col>
  </v-row>

  <!-- 🎂 Premium Birthday Collection Modal (The Curated Arena Style) -->
  <v-dialog v-model="showBirthdayModal" persistent max-width="500px">
    <v-card class="birthday-modal-card rounded-xl overflow-hidden border-0 shadow-2xl">
      <div class="premium-gradient-bg"></div>
      
      <v-card-text class="pa-0">
        <v-row no-gutters>
          <v-col cols="12" class="pa-8">
            <div class="d-flex justify-end mb-4">
              <v-btn icon="mdi-close" variant="text" density="comfortable" color="slate-400" @click="showBirthdayModal = false"></v-btn>
            </div>
            
            <div class="asymmetric-content">
              <div class="editorial-accent mb-6"></div>
              <h2 class="display-lg text-slate-900 font-weight-black mb-4">
                Happy<br>Birthday?
              </h2>
              <p class="text-body-1 text-slate-500 mb-8 max-w-xs">
                We'd love to celebrate your special day with the EduSport family. Please share your birth date.
              </p>

              <div class="input-container mb-10">
                <label class="text-caption font-weight-bold text-uppercase tracking-widest text-slate-400 d-block mb-2">Select Your Date</label>
                <input 
                  type="date" 
                  v-model="birthdayDate" 
                  class="premium-date-input"
                />
              </div>

              <v-btn
                block
                height="60"
                class="complete-profile-btn text-none text-subtitle-1 font-weight-bold rounded-xl"
                :loading="isSubmitting"
                :disabled="!birthdayDate"
                @click="saveBirthday"
              >
                Complete Profile
                <v-icon end size="18">mdi-arrow-right</v-icon>
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- 📈 Today's Login Activity Report Modal -->
  <UserLoginStatusModal v-model="showLoginStatusModal" />
  <AssignedUserLoginStatusModal v-model="showAssignedLoginStatusModal" />
  
  <!-- 📅 Principal PTM Scheduling Modal -->
  <PTMDateModal v-model="showPtmModal" @saved="triggerLoginModal" />
</template>

<style scoped>
.birthday-modal-card {
  background: #ffffff !important;
  position: relative;
}

.premium-gradient-bg {
  position: absolute;
  top: -100px;
  right: -100px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(79, 70, 229, 0.08) 0%, rgba(255, 255, 255, 0) 70%);
  z-index: 0;
  pointer-events: none;
}

.display-lg {
  font-size: 3.5rem;
  line-height: 1;
  letter-spacing: -0.04em;
}

.editorial-accent {
  width: 40px;
  height: 4px;
  background: #3525cd;
  border-radius: 2px;
}

.text-slate-900 { color: #0F172A !important; }
.text-slate-500 { color: #64748B !important; }
.text-slate-400 { color: #94A3B8 !important; }

.max-w-xs {
  max-width: 280px;
}

.premium-date-input {
  width: 100%;
  padding: 16px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #0F172A;
  background: transparent;
  border: none;
  border-bottom: 2px solid #E2E8F0;
  transition: border-color 0.3s ease;
  outline: none;
}

.premium-date-input:focus {
  border-bottom-color: #3525cd;
}

.complete-profile-btn {
  background: linear-gradient(135deg, #3525cd 0%, #4f46e5 100%) !important;
  color: white !important;
  box-shadow: 0 10px 20px rgba(53, 37, 205, 0.2) !important;
  transition: all 0.3s ease !important;
}

.complete-profile-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px rgba(53, 37, 205, 0.3) !important;
}

.complete-profile-btn:disabled {
  opacity: 0.6;
  background: #E2E8F0 !important;
  color: #94A3B8 !important;
  box-shadow: none !important;
}

.tracking-widest {
  letter-spacing: 0.1em !important;
}

.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(11, 28, 48, 0.25) !important;
}

/* Glassmorphism subtle touch */
.asymmetric-content {
  position: relative;
  z-index: 1;
}

@media (max-width: 600px) {
  .display-lg {
    font-size: 2.5rem;
  }
}
</style>
