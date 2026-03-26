<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const loading = ref(false);
const schools = ref([]);

const form = ref({
  name: '',
  gender: 'Male',
  school_name: '',
  standard: '',
  division: '',
  gr_number: '',
  mq_id: ''
});

const fetchSchools = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/schools');
    const data = await res.json();
    if (data.success) schools.value = data.schools;
  } catch (e) {
    console.error('Error loading schools:', e);
  }
};

onMounted(fetchSchools);

const submitForm = async () => {
  loading.value = true;
  try {
    const res = await fetch('http://localhost:3000/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mq_id: form.value.mq_id,
        name: form.value.name,
        school_name: form.value.school_name,
        standard: form.value.standard,
        division: form.value.division,
        gr_number: form.value.gr_number,
        gender: form.value.gender,
        status: 'Active'
      })
    });
    const data = await res.json();
    if (data.success) {
      router.push('/student');
    } else {
      alert('Failed to register student: ' + data.message);
    }
  } catch (error) {
    console.error('Registration error:', error);
    alert('An error occurred during registration.');
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="px-2 py-8 tailwind-wrapper min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-inter">
    <div class="max-w-3xl mx-auto w-full p-4 sm:p-8">

      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">
        <div>
          <nav class="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 font-manrope">
            <span>Students</span>
            <span class="material-symbols-outlined text-[14px]">chevron_right</span>
            <span class="text-primary">Add Student</span>
          </nav>
          <h3 class="text-3xl font-extrabold text-[#1e293b] tracking-tight font-manrope">Add New Student</h3>
          <p class="text-slate-500 text-sm mt-1">Fill in the fields below to register a new student.</p>
        </div>
        <button @click="router.push('/student')" class="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-bold text-sm shadow-sm flex items-center gap-2 font-manrope">
          <span class="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>
      </div>

      <form @submit.prevent="submitForm">
        <section class="bg-white p-8 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

            <!-- School -->
            <div class="md:col-span-2">
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-2">School <span class="text-rose-500">*</span></label>
              <div class="relative">
                <select v-model="form.school_name" required class="w-full border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm py-3.5 pl-4 pr-10 font-bold text-slate-700 outline-none transition-all appearance-none cursor-pointer">
                  <option value="" disabled>Select School</option>
                  <option v-for="s in schools" :key="s.id" :value="s.name">{{ s.name }}</option>
                </select>
                <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
              </div>
            </div>

            <!-- Std -->
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-2">Std <span class="text-rose-500">*</span></label>
              <div class="relative">
                <select v-model="form.standard" required class="w-full border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm py-3.5 pl-4 pr-10 font-bold text-slate-700 outline-none transition-all appearance-none cursor-pointer">
                  <option value="" disabled>Select Std</option>
                  <option>Nursery</option>
                  <option>Jr.Kg</option>
                  <option>Sr.Kg</option>
                  <option>LKG</option>
                  <option>UKG</option>
                  <option>1st</option>
                  <option>2nd</option>
                  <option>3rd</option>
                  <option>4th</option>
                  <option>5th</option>
                  <option>6th</option>
                  <option>7th</option>
                  <option>8th</option>
                  <option>9th</option>
                  <option>10th</option>
                  <option>11th</option>
                  <option>12th</option>
                </select>
                <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
              </div>
            </div>

            <!-- Division -->
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-2">Division</label>
              <input v-model="form.division" class="w-full border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm py-3.5 px-4 font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal" placeholder="e.g. A" type="text" />
            </div>

            <!-- Student Name -->
            <div class="md:col-span-2">
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-2">Student Name <span class="text-rose-500">*</span></label>
              <input v-model="form.name" required class="w-full border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm py-3.5 px-4 font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal" placeholder="Student Name" type="text" />
            </div>

            <!-- GR Number -->
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-2">GR Number</label>
              <input v-model="form.gr_number" class="w-full border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm py-3.5 px-4 font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal" placeholder="GR Number" type="text" />
            </div>

            <!-- MQ ID -->
            <div>
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-2">MQ ID</label>
              <input v-model="form.mq_id" class="w-full border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm py-3.5 px-4 font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal" placeholder="MQ ID" type="text" />
            </div>

            <!-- Gender -->
            <div class="md:col-span-2">
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-2">Gender</label>
              <div class="flex gap-3">
                <button
                  type="button"
                  v-for="g in ['Male', 'Female', 'Other']"
                  :key="g"
                  @click="form.gender = g"
                  :class="[
                    'px-6 py-2.5 rounded-xl border text-sm font-bold transition-all font-manrope',
                    form.gender === g
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-primary/40 hover:text-primary'
                  ]"
                >{{ g }}</button>
              </div>
            </div>

          </div>
        </section>

        <!-- Form Actions -->
        <div class="flex items-center justify-end gap-4 pt-6 pb-20">
          <button @click="router.push('/student')" type="button" class="px-8 py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200/50 hover:text-slate-700 transition-colors font-manrope uppercase tracking-widest text-xs">
            Cancel
          </button>
          <button type="submit" :disabled="loading" class="px-10 py-3.5 rounded-xl font-bold text-white bg-primary hover:bg-[#004a88] shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center gap-2 font-manrope uppercase tracking-widest text-xs disabled:opacity-70 disabled:pointer-events-none">
            {{ loading ? 'Saving...' : 'Register Student' }}
            <span class="material-symbols-outlined text-[18px]" v-if="!loading">how_to_reg</span>
          </button>
        </div>
      </form>

    </div>
  </div>
</template>
