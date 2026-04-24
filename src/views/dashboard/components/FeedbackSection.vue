<template>
  <v-card variant="outlined" class="bg-surface rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-6"
    style="min-height: 260px;">
    <v-card-text class="pa-6 overflow-y-auto h-full flex flex-col justify-between">
      
      <div v-if="success" class="flex flex-col items-center justify-center text-center animate-in zoom-in duration-300 py-8 my-auto">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
          <span class="material-symbols-outlined text-3xl">check_circle</span>
        </div>
        <h4 class="text-lg font-black text-slate-800 mb-1">Thank You!</h4>
        <p class="text-xs text-slate-500 font-medium mb-6">Your feedback helps us improve.</p>
        <v-btn color="primary" variant="tonal" rounded="xl" @click="resetForm" class="font-bold tracking-widest text-[10px] uppercase">
          Submit Another
        </v-btn>
      </div>

      <div v-else class="flex flex-col h-full">
        <!-- Header with Live Status and Avatars -->
        <div class="d-flex align-center justify-space-between mb-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <div class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <h5 class="text-h5 font-black text-slate-900 mb-0 leading-tight">Share Feedback</h5>
            </div>
          </div>
          <div class="d-flex align-center justify-center flex-wrap flex-row-reverse">
            <v-avatar size="36" variant="outlined" color="white" class="ml-n3 border-2 border-white shadow-sm">
              <img src="@/assets/images/users/avatar-5.png" width="36" alt="user" />
            </v-avatar>
            <v-avatar size="36" variant="outlined" color="white" class="border-2 border-white shadow-sm">
              <img src="@/assets/images/users/avatar-4.png" width="36" alt="user" />
            </v-avatar>
          </div>
        </div>

        <!-- Description -->
        <p class="text-xs text-slate-500 font-medium leading-relaxed mb-6">
          Tell us what's working well or what could be improved. Your insights help shape the future of our platform.
        </p>

        <!-- Form Fields inside Card -->
        <v-form @submit.prevent="submitFeedback" class="space-y-4 flex-grow flex flex-col justify-end">
          <div>
            <input 
              v-model="form.subject" 
              type="text" 
              required
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="Feedback Subject..."
            />
          </div>

          <div>
            <textarea 
              v-model="form.message" 
              required
              rows="3"
              class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
              placeholder="Tell us what's on your mind..."
            ></textarea>
          </div>

          <v-btn 
            type="submit" 
            color="primary" 
            block 
            variant="flat" 
            size="large"
            class="rounded-xl font-black text-[12px] uppercase tracking-widest h-[52px] mt-2"
            :loading="loading"
            :disabled="!form.subject || !form.message"
          >
            <span class="material-symbols-outlined mr-2">send</span>
            Submit Feedback
          </v-btn>
        </v-form>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const form = ref({
  subject: '',
  message: ''
});

const loading = ref(false);
const success = ref(false);

const submitFeedback = async () => {
  if (!form.value.subject || !form.value.message) return;
  
  loading.value = true;
  try {
    const payload = {
      subject: form.value.subject,
      message: form.value.message,
      name: sessionStorage.getItem('name') || 'User',
      email: sessionStorage.getItem('email') || 'user@example.com',
      user_id: sessionStorage.getItem('id') || null
    };

    const res = await fetch('/api/support/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      success.value = true;
    } else {
      alert('Failed to submit feedback.');
    }
  } catch (err) {
    console.error('Feedback error:', err);
    alert('An error occurred. Please try again.');
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  form.value.subject = '';
  form.value.message = '';
  success.value = false;
};
</script>

<style scoped>
.text-slate-900 {
  color: #0F172A !important;
}

.text-slate-400 {
  color: #94A3B8 !important;
}

.text-slate-500 {
  color: #64748B !important;
}

.tracking-wider {
  letter-spacing: 0.1em !important;
}

.tracking-widest {
  letter-spacing: 0.15em !important;
}

/* Custom Pulse Animation */
@keyframes pulse {
  0% {
    transform: scale(0.95);
    opacity: 0.7;
  }

  50% {
    transform: scale(1);
    opacity: 1;
  }

  100% {
    transform: scale(0.95);
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
