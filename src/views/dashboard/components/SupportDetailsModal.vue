<template>
  <v-dialog v-model="isOpen" max-width="600" persistent>
    <v-card class="rounded-[2.5rem] pa-10 bg-white border border-slate-100 shadow-2xl">
      <v-card-title class="px-0 pt-0 text-h4 font-black text-slate-900 pb-2 flex justify-between items-center">
        Raise Support Ticket
        <v-btn icon variant="text" @click="isOpen = false" color="slate-400">
          <span class="material-symbols-outlined">close</span>
        </v-btn>
      </v-card-title>
      <p class="text-slate-500 font-medium text-sm mb-10">Please provide detailed information about the issue so we can assist you better.</p>

      <v-form @submit.prevent="submitTicket" class="space-y-6">
        <div class="space-y-2">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grievance Subject</label>
          <v-text-field v-model="form.subject" placeholder="e.g. Syllabus mismatch in Grade 4" variant="outlined" density="comfortable" class="rounded-xl custom-field"></v-text-field>
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Name</label>
            <v-text-field v-model="form.name" placeholder="Full name" variant="outlined" density="comfortable" class="rounded-xl custom-field"></v-text-field>
          </div>
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
            <v-text-field v-model="form.email" placeholder="Contact email" variant="outlined" density="comfortable" class="rounded-xl custom-field"></v-text-field>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Problem Description</label>
          <v-textarea v-model="form.message" placeholder="Describe the issue in detail..." variant="outlined" rows="4" density="comfortable" class="rounded-xl custom-field"></v-textarea>
        </div>

        <div class="pt-6">
          <v-btn type="submit" :loading="submitting" block color="primary" size="large" class="rounded-xl h-[60px] font-black text-[12px] uppercase tracking-widest shadow-lg">
            <span class="material-symbols-outlined mr-2">send</span>
            Register Ticket
          </v-btn>
        </div>
      </v-form>

      <v-alert v-if="successMsg" type="success" variant="tonal" class="mt-6 rounded-xl font-bold text-sm">
        {{ successMsg }}
      </v-alert>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps({
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue']);

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const submitting = ref(false);
const successMsg = ref('');
const form = ref({
  subject: '',
  name: '',
  email: '',
  message: ''
});

const submitTicket = async () => {
  submitting.value = true;
  successMsg.value = '';
  try {
    const res = await fetch('/api/support/ticket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    });
    const data = await res.json();
    if (data.success) {
      successMsg.value = 'Your ticket has been registered. Our team will contact you soon.';
      setTimeout(() => {
        emit('update:modelValue', false);
        form.value = { subject: '', name: '', email: '', message: '' };
        successMsg.value = '';
      }, 2000);
    }
  } catch (err) {
    console.error('Submit error:', err);
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.custom-field :deep(.v-field__outline) { border-radius: 12px !important; border-color: #f1f5f9 !important; }
.custom-field :deep(.v-field__input) { color: #1e293b !important; font-weight: 600 !important; font-size: 13px !important; }
.text-slate-900 { color: #0F172A !important; }
.text-slate-400 { color: #94A3B8 !important; }
.text-slate-500 { color: #64748B !important; }
</style>
