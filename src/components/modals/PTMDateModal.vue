<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" persistent max-width="500px">
    <v-card class="ptm-modal-card rounded-xl overflow-hidden border-0 shadow-2xl">
      <div class="premium-gradient-bg"></div>
      
      <v-card-text class="pa-0">
        <v-row no-gutters>
          <v-col cols="12" class="pa-8">
            <div class="d-flex justify-end mb-4">
              <v-btn icon="mdi-close" variant="text" density="comfortable" color="slate-400" @click="closeModal"></v-btn>
            </div>
            
            <div class="asymmetric-content">
              <div class="editorial-accent mb-6"></div>
              <h2 class="display-lg text-slate-900 font-weight-black mb-4">
                Schedule<br>PTM
              </h2>
              <p class="text-body-1 text-slate-500 mb-8 max-w-xs">
                As the Principal, please schedule the next Parent-Teacher Meeting (PTM) date for your school.
              </p>

              <div class="input-container mb-10">
                <label class="text-caption font-weight-bold text-uppercase tracking-widest text-slate-400 d-block mb-2">Select PTM Month & Year</label>
                <input 
                  type="month" 
                  v-model="ptmDate" 
                  class="premium-date-input"
                />
              </div>

              <v-btn
                block
                height="60"
                class="complete-profile-btn text-none text-subtitle-1 font-weight-bold rounded-xl"
                :loading="isSubmitting"
                :disabled="!ptmDate"
                @click="savePtmDate"
              >
                Schedule PTM
                <v-icon end size="18">mdi-calendar-check</v-icon>
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits(['update:modelValue', 'saved']);

const authStore = useAuthStore();
const ptmDate = ref('');
const isSubmitting = ref(false);

const closeModal = () => {
  emit('update:modelValue', false);
  emit('saved'); // Even if closed manually, emit saved to trigger the next modal in the queue
};

const savePtmDate = async () => {
  const userId = authStore.user?.id || sessionStorage.getItem('id');
  if (!ptmDate.value || !userId) return;
  
  isSubmitting.value = true;
  try {
    const response = await fetch('/api/ptm-date', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: userId,
        ptmDate: ptmDate.value
      })
    });
    const data = await response.json();
    if (data.success) {
      emit('update:modelValue', false);
      emit('saved');
    }
  } catch (error) {
    console.error('Error saving PTM date:', error);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.ptm-modal-card {
  background: #ffffff !important;
  position: relative;
}

.premium-gradient-bg {
  position: absolute;
  top: -100px;
  right: -100px;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, rgba(255, 255, 255, 0) 70%); /* Emerald gradient instead of indigo */
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
  background: #10b981; /* Emerald */
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
  border-bottom-color: #10b981;
}

.complete-profile-btn {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%) !important;
  color: white !important;
  box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2) !important;
  transition: all 0.3s ease !important;
}

.complete-profile-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px rgba(16, 185, 129, 0.3) !important;
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
