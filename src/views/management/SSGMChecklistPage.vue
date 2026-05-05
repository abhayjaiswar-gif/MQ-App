<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();
const loading = ref(false);
const submitting = ref(false);
const schools = ref<any[]>([]);
const checklists = ref<any[]>([]);
const moms = ref<any[]>([]);
const viewMode = ref<'list' | 'form' | 'mom_form'>('list');
const listTab = ref<'checklists' | 'moms'>('checklists');
const editingId = ref<number | null>(null);

const initialMomForm = {
  school_id: null,
  school_name: '',
  person_met: '',
  meeting_concerns: '',
  coach_concerns: '',
  consensus: '',
  mom_summary: ''
};
const momForm = ref({ ...initialMomForm });

const initialForm = {
  school_id: null,
  school_name: '',
  conducted_at: new Date().toISOString().slice(0, 16),
  auditor_name: authStore.user?.name || '',
  auditor_role: 'Lead Auditor',
  location: '',

  // Section A: Coach Professional Standards
  arrive_on_time: true,
  arrive_on_time_why: '',
  actively_engaged: true,
  actively_engaged_why: '',
  professional_behavior: true,
  professional_behavior_why: '',

  uniform_tshirt_type: 'Proper MQ T-shirt',
  uniform_pants_type: 'MQ Track',
  uniform_shoes_type: 'Sports shoes',
  uniform_whistle_wearing: 'Wearing',
  grooming_type: 'Clean appearance',

  equipment_safe: true,
  proper_setup: true,
  students_engaged_obs: true,
  discipline_effective: true,
  observations_pos: '',
  observations_neg: '',

  // Section B: Well-being & Logistics
  wellbeing_issues: [],
  fail_standards: false,
  concern_types: [],
  disciplinary_recommendations: '',

  // Section C: Stakeholders
  stakeholder_types: [],
  stakeholder_name: '',
  stakeholder_designation: '',
  stakeholder_points: '',
  stakeholder_pos_feedback: '',
  stakeholder_concerns: '',

  // Section D: School Relationship
  satisfaction_rating: 'Satisfied',
  new_initiatives: '',
  urgent_complaints: '',

  // Section E: Sentiment
  engagement_level: 'Highly excited',
  safety_measures_taken: true,
  parent_testimonies: '',
  student_requests: '',

  // Section F: Plans & Growth
  upcoming_event_name: '',
  upcoming_event_date: '',
  mq_support_expected: '',
  growth_potential: 'High potential',
  infra_support_needed: false,
  infra_requirements: '',

  // Section G: Warning Signs
  warning_signs_observed: false,
  warning_signs_desc: '',

  // Section H: Insights
  insight_1: '',
  insight_2: '',
  insight_3: '',
  hq_immediate_action: '',
  long_term_opportunity: '',

  // Section I
  overall_performance: 'Good'
};

const form = ref({ ...initialForm });

const fetchSchools = async () => {
  try {
    let url = '/api/schools';
    const roleId = authStore.user?.role_id;
    if (roleId !== 1 && roleId !== 7) {
      url += `?user_id=${authStore.user?.id}`;
    }
    const res = await axios.get(url);
    if (res.data.success) {
      schools.value = res.data.schools;
    }
  } catch (err) {
    console.error('Fetch Schools Error:', err);
  }
};

const fetchChecklists = async () => {
  loading.value = true;
  try {
    let url = '/api/sggm-checklist';
    const roleId = authStore.user?.role_id;
    if (roleId !== 1 && roleId !== 7) {
      url += `?assigned_user_id=${authStore.user?.id}`;
    }
    const res = await axios.get(url);
    if (res.data.success) {
      checklists.value = res.data.checklists;
    }
  } catch (err) {
    console.error('Fetch Checklists Error:', err);
  } finally {
    loading.value = false;
  }
};

const fetchMoms = async () => {
  try {
    let url = '/api/sggm-mom';
    const roleId = authStore.user?.role_id;
    if (roleId !== 1 && roleId !== 7) {
      url += `?assigned_user_id=${authStore.user?.id}`;
    }
    const res = await axios.get(url);
    if (res.data.success) {
      moms.value = res.data.moms;
    }
  } catch (err) {
    console.error('Fetch MOMs Error:', err);
  }
};

onMounted(() => {
  fetchSchools();
  fetchChecklists();
  fetchMoms();
});

const openAddMom = () => {
  momForm.value = { ...initialMomForm };
  editingId.value = null;
  viewMode.value = 'mom_form';
};

const openEditMom = (item: any) => {
  editingId.value = item.id;
  momForm.value = { ...item };
  viewMode.value = 'mom_form';
};

const onMomSchoolChange = () => {
  const school = schools.value.find(s => s.id === momForm.value.school_id);
  if (school) {
    momForm.value.school_name = school.name;
  }
};

const submitMom = async () => {
  if (!momForm.value.school_id) {
    alert('Please select a school');
    return;
  }
  
  submitting.value = true;
  try {
    const payload = { ...momForm.value };
    if (!editingId.value) {
      payload.user_id = authStore.user?.id;
    }
    
    let res;
    if (editingId.value) {
      res = await axios.put(`/api/sggm-mom/${editingId.value}`, payload);
    } else {
      res = await axios.post('/api/sggm-mom', payload);
    }

    if (res.data.success) {
      alert(editingId.value ? 'MOM updated successfully!' : 'MOM submitted successfully!');
      fetchMoms();
      viewMode.value = 'list';
      listTab.value = 'moms';
    }
  } catch (err) {
    console.error('Submit MOM Error:', err);
    alert('Failed to submit MOM');
  } finally {
    submitting.value = false;
  }
};

const openAdd = () => {
  form.value = { ...initialForm };
  editingId.value = null;
  viewMode.value = 'form';
};

const openEdit = (item: any) => {
  editingId.value = item.id;
  const parsedItem = { ...item };

  // Convert JSON strings back to arrays
  try {
    parsedItem.wellbeing_issues = typeof item.wellbeing_issues === 'string' ? JSON.parse(item.wellbeing_issues || '[]') : (item.wellbeing_issues || []);
    parsedItem.concern_types = typeof item.concern_types === 'string' ? JSON.parse(item.concern_types || '[]') : (item.concern_types || []);
    parsedItem.stakeholder_types = typeof item.stakeholder_types === 'string' ? JSON.parse(item.stakeholder_types || '[]') : (item.stakeholder_types || []);
  } catch (e) {
    console.error('JSON Parse Error:', e);
    parsedItem.wellbeing_issues = [];
    parsedItem.concern_types = [];
    parsedItem.stakeholder_types = [];
  }

  // Convert MySQL tinyint (1/0) to Booleans for Vue v-model
  const booleanFields = [
    'arrive_on_time', 'actively_engaged', 'professional_behavior',
    'equipment_safe', 'proper_setup', 'students_engaged_obs', 'discipline_effective',
    'fail_standards', 'safety_measures_taken', 'infra_support_needed', 'warning_signs_observed'
  ];
  booleanFields.forEach(field => {
    parsedItem[field] = !!item[field];
  });

  // Handle Dates
  if (parsedItem.upcoming_event_date) {
    parsedItem.upcoming_event_date = new Date(parsedItem.upcoming_event_date).toISOString().split('T')[0];
  }
  if (parsedItem.conducted_at) {
    parsedItem.conducted_at = new Date(parsedItem.conducted_at).toISOString().slice(0, 16);
  }

  form.value = parsedItem;
  viewMode.value = 'form';
};


const onSchoolChange = () => {
  const school = schools.value.find(s => s.id === form.value.school_id);
  if (school) {
    form.value.school_name = school.name;
  }
};

const getLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      form.value.location = `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
    }, (error) => {
      console.error('Geolocation error:', error);
      alert('Unable to retrieve location.');
    });
  } else {
    alert('Geolocation is not supported by this browser.');
  }
};

const submitChecklist = async () => {
  if (!form.value.school_id) {
    alert('Please select a school');
    return;
  }

  submitting.value = true;
  try {
    let res;
    if (editingId.value) {
      res = await axios.put(`/api/sggm-checklist/${editingId.value}`, form.value);
    } else {
      res = await axios.post('/api/sggm-checklist', form.value);
    }

    if (res.data.success) {
      alert(editingId.value ? 'Audit updated successfully!' : 'Audit submitted successfully!');
      fetchChecklists();
      viewMode.value = 'list';
    }
  } catch (err) {
    console.error('Submit Error:', err);
    alert('Failed to submit audit');
  } finally {
    submitting.value = false;
  }
};

const toggleItem = (arr: any[], item: any) => {
  const idx = arr.indexOf(item);
  if (idx > -1) arr.splice(idx, 1);
  else arr.push(item);
};

const performanceOptions = ['Excellent', 'Good', 'Average', 'Needs Improvement'];

const formatDate = (date: string) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
</script>

<template>
  <div class="min-h-screen bg-[#f9f9f9] text-[#1a1c1c] font-['Inter'] relative overflow-x-hidden">
    <!-- Main Canvas -->
    <main class="w-full p-6 lg:p-10 custom-scrollbar overflow-y-auto">

      <!-- List View -->
      <div v-if="viewMode === 'list'" class="max-w-6xl mx-auto">
        <header class="mb-10">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 class="text-3xl font-extrabold font-['Manrope'] tracking-tight text-[#1a1c1c]">SSGM Checklists</h1>
              <p class="text-[#404753] text-sm mt-1">Manage and view all school audit reports.</p>
            </div>
            <div class="flex gap-3">
              <button @click="openAddMom"
                class="px-6 py-3 bg-white text-[#005daa] border border-[#005daa] rounded-xl font-bold hover:bg-[#005daa]/5 transition-all flex items-center gap-2">
                <span class="material-symbols-outlined">post_add</span>
                Add MOM
              </button>
              <button @click="openAdd"
                class="px-6 py-3 bg-[#005daa] text-white rounded-xl font-bold shadow-lg shadow-[#005daa]/20 hover:scale-95 transition-all flex items-center gap-2">
                <span class="material-symbols-outlined">add</span>
                Add Check List (Observation)
              </button>
            </div>
          </div>
        </header>

        <!-- Tabs -->
        <div class="mb-6 flex border-b border-slate-200">
          <button @click="listTab = 'checklists'" :class="listTab === 'checklists' ? 'border-[#005daa] text-[#005daa] font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'" class="px-6 py-3 border-b-2 transition-colors font-medium">School Observations</button>
          <button @click="listTab = 'moms'" :class="listTab === 'moms' ? 'border-[#005daa] text-[#005daa] font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'" class="px-6 py-3 border-b-2 transition-colors font-medium">Minutes of Meeting</button>
        </div>

        <div v-if="listTab === 'checklists'" class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div v-if="loading" class="p-20 flex flex-col items-center justify-center gap-4">
            <span class="material-symbols-outlined animate-spin text-4xl text-[#005daa]">refresh</span>
            <p class="text-sm font-medium text-slate-400">Loading audit history...</p>
          </div>
          <div v-else-if="checklists.length === 0" class="p-20 flex flex-col items-center justify-center gap-4">
            <span class="material-symbols-outlined text-6xl text-slate-200">assignment_late</span>
            <p class="text-sm font-medium text-slate-400">No audits found. Start by adding your first one!</p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-100">
                  <th class="px-6 py-4 text-[10px] font-bold text-[#404753] uppercase tracking-wider">School Name</th>
                  <th class="px-6 py-4 text-[10px] font-bold text-[#404753] uppercase tracking-wider">Auditor</th>
                  <th class="px-6 py-4 text-[10px] font-bold text-[#404753] uppercase tracking-wider">Date</th>
                  <th class="px-6 py-4 text-[10px] font-bold text-[#404753] uppercase tracking-wider">Performance</th>
                  <th class="px-6 py-4 text-[10px] font-bold text-[#404753] uppercase tracking-wider text-right">Actions
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-for="item in checklists" :key="item.id" class="hover:bg-slate-50/50 transition-colors group">
                  <td class="px-6 py-4">
                    <p class="text-sm font-bold text-[#1a1c1c]">{{ item.school_name }}</p>
                    <p class="text-[10px] text-slate-400 flex items-center gap-1">
                      <span class="material-symbols-outlined text-[12px]">location_on</span>
                      {{ item.location || 'No location' }}
                    </p>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2">
                      <div
                        class="w-6 h-6 rounded-full bg-[#005daa]/10 flex items-center justify-center text-[#005daa] text-[10px] font-bold">
                        {{ item.auditor_name.charAt(0) }}
                      </div>
                      <p class="text-xs font-medium">{{ item.auditor_name }}</p>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-xs font-medium text-slate-500">
                    {{ formatDate(item.conducted_at) }}
                  </td>
                  <td class="px-6 py-4">
                    <span :class="{
                      'bg-emerald-50 text-emerald-600': item.overall_performance === 'Excellent',
                      'bg-blue-50 text-blue-600': item.overall_performance === 'Good',
                      'bg-amber-50 text-amber-600': item.overall_performance === 'Average',
                      'bg-rose-50 text-rose-600': item.overall_performance === 'Needs Improvement'
                    }" class="px-3 py-1 rounded-full text-[10px] font-bold">
                      {{ item.overall_performance }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button @click="openEdit(item)"
                      class="p-2 hover:bg-[#005daa]/5 text-[#005daa] rounded-lg transition-all group-hover:scale-110">
                      <span class="material-symbols-outlined text-lg">edit_square</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- MOMs Table -->
        <div v-else-if="listTab === 'moms'" class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div v-if="loading" class="p-20 flex flex-col items-center justify-center gap-4">
            <span class="material-symbols-outlined animate-spin text-4xl text-[#005daa]">refresh</span>
            <p class="text-sm font-medium text-slate-400">Loading MOMs...</p>
          </div>
          <div v-else-if="moms.length === 0" class="p-20 flex flex-col items-center justify-center gap-4">
            <span class="material-symbols-outlined text-6xl text-slate-200">post_add</span>
            <p class="text-sm font-medium text-slate-400">No Minutes of Meeting found. Start by adding one!</p>
          </div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50 border-b border-slate-100">
                  <th class="px-6 py-4 text-[10px] font-bold text-[#404753] uppercase tracking-wider">School Name</th>
                  <th class="px-6 py-4 text-[10px] font-bold text-[#404753] uppercase tracking-wider">Person Met</th>
                  <th class="px-6 py-4 text-[10px] font-bold text-[#404753] uppercase tracking-wider">Date</th>
                  <th class="px-6 py-4 text-[10px] font-bold text-[#404753] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-50">
                <tr v-for="item in moms" :key="item.id" class="hover:bg-slate-50/50 transition-colors group">
                  <td class="px-6 py-4">
                    <p class="text-sm font-bold text-[#1a1c1c]">{{ item.school_name }}</p>
                  </td>
                  <td class="px-6 py-4">
                    <p class="text-xs font-medium">{{ item.person_met }}</p>
                  </td>
                  <td class="px-6 py-4 text-xs font-medium text-slate-500">
                    {{ formatDate(item.created_at) }}
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button @click="openEditMom(item)"
                      class="p-2 hover:bg-[#005daa]/5 text-[#005daa] rounded-lg transition-all group-hover:scale-110">
                      <span class="material-symbols-outlined text-lg">edit_square</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Checklist Form View -->
      <div v-else-if="viewMode === 'form'" class="max-w-5xl mx-auto">
        <header class="mb-10">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <nav class="flex gap-2 text-xs font-medium text-[#404753] mb-2">
                <button @click="viewMode = 'list'" class="hover:text-[#005daa] transition-colors">Audits</button>
                <span class="material-symbols-outlined text-[10px]">arrow_forward_ios</span>
                <span>{{ editingId ? 'Edit' : 'Add' }} Audit</span>
              </nav>
              <h1 class="text-3xl font-extrabold font-['Manrope'] tracking-tight text-[#1a1c1c]">
                {{ editingId ? 'Edit Audit Report' : 'New School Visit' }}
              </h1>
              <p class="text-[#404753] text-sm mt-1">
                {{ editingId ? 'Updating existing record for ' : 'Conducting audit at: ' }}
                <span class="font-semibold text-[#005daa]" v-if="form.school_name">{{ form.school_name }}</span>
                <span class="italic text-slate-400" v-else>Select a school below</span>
              </p>
            </div>
            <div class="flex gap-3">
              <button @click="viewMode = 'list'"
                class="px-5 py-2 text-sm font-semibold rounded-lg bg-[#f3f3f3] text-[#404753] hover:bg-[#e8e8e8] transition-all">Cancel</button>
              <button @click="submitChecklist" :disabled="submitting"
                class="px-5 py-2 text-sm font-semibold rounded-lg bg-[#005daa] text-white shadow-lg shadow-[#005daa]/20 hover:scale-95 transition-all flex items-center gap-2">
                <span v-if="submitting" class="material-symbols-outlined animate-spin text-sm">refresh</span>
                {{ submitting ? 'Saving...' : (editingId ? 'Update Audit' : 'Submit Audit') }}
              </button>
            </div>
          </div>
        </header>

        <div class="space-y-8">

          <!-- School & Location Verification -->
          <section class="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-slate-100">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div class="space-y-4">
                <label class="block text-xs font-bold text-[#404753] uppercase tracking-wider">Target School</label>
                <select v-model="form.school_id" @change="onSchoolChange"
                  class="w-full border-none bg-[#f9f9f9] rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-[#005daa]/20 transition-all">
                  <option :value="null">Select a school for audit...</option>
                  <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
              </div>
              <div class="space-y-4">
                <label class="block text-xs font-bold text-[#404753] uppercase tracking-wider">GPS Verification</label>
                <div class="flex gap-2">
                  <div
                    class="flex-grow bg-[#f9f9f9] rounded-xl px-4 py-3 text-sm font-mono flex items-center gap-2 text-[#404753]">
                    <span class="material-symbols-outlined text-sm"
                      :class="form.location ? 'text-emerald-500' : 'text-slate-300'">
                      {{ form.location ? 'location_on' : 'location_off' }}
                    </span>
                    {{ form.location || 'Location not verified' }}
                  </div>
                  <button @click="getLocation"
                    class="px-4 py-3 bg-white border-2 border-[#005daa] text-[#005daa] rounded-xl text-xs font-bold hover:bg-[#005daa] hover:text-white transition-all flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">my_location</span>
                    Get Location
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- Section A: Coach Professional Standards -->
          <section class="bg-white rounded-xl p-6 lg:p-8 shadow-sm">
            <div class="flex items-center gap-3 mb-6">
              <span class="w-8 h-8 rounded-lg bg-[#d4e3ff] flex items-center justify-center">
                <span class="material-symbols-outlined text-[#001c3a] text-lg"
                  style="font-variation-settings: 'FILL' 1;">verified_user</span>
              </span>
              <h2 class="text-xl font-bold font-['Manrope']">Section A: Coach Professional Standards</h2>
            </div>

            <!-- Coach Presence & behavior -->
            <div class="mb-10">
              <label class="block text-xs font-bold text-[#404753] uppercase tracking-wider mb-4">Coach Presence &
                behavior</label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="p-4 bg-[#f9f9f9] rounded-xl space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium">Did all assigned coaches arrive on time for the session?</span>
                    <div class="flex gap-2">
                      <button @click="form.arrive_on_time = true"
                        :class="form.arrive_on_time ? 'bg-[#005daa] text-white shadow-md' : 'bg-white text-slate-400'"
                        class="px-4 py-1.5 text-xs font-bold rounded-lg transition-all">Yes</button>
                      <button @click="form.arrive_on_time = false"
                        :class="!form.arrive_on_time ? 'bg-[#ba1a1a] text-white shadow-md' : 'bg-white text-slate-400'"
                        class="px-4 py-1.5 text-xs font-bold rounded-lg transition-all">No</button>
                    </div>
                  </div>
                  <textarea v-if="!form.arrive_on_time" v-model="form.arrive_on_time_why" placeholder="If No, why?"
                    class="w-full text-xs border-none bg-white rounded-lg p-3 focus:ring-1 focus:ring-[#005daa] h-16 resize-none"></textarea>
                </div>
                <div class="p-4 bg-[#f9f9f9] rounded-xl space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium">Were coaches present and actively engaged throughout the
                      session?</span>
                    <div class="flex gap-2">
                      <button @click="form.actively_engaged = true"
                        :class="form.actively_engaged ? 'bg-[#005daa] text-white shadow-md' : 'bg-white text-slate-400'"
                        class="px-4 py-1.5 text-xs font-bold rounded-lg transition-all">Yes</button>
                      <button @click="form.actively_engaged = false"
                        :class="!form.actively_engaged ? 'bg-[#ba1a1a] text-white shadow-md' : 'bg-white text-slate-400'"
                        class="px-4 py-1.5 text-xs font-bold rounded-lg transition-all">No</button>
                    </div>
                  </div>
                  <textarea v-if="!form.actively_engaged" v-model="form.actively_engaged_why" placeholder="If No, why?"
                    class="w-full text-xs border-none bg-white rounded-lg p-3 focus:ring-1 focus:ring-[#005daa] h-16 resize-none"></textarea>
                </div>
                <div class="p-4 bg-[#f9f9f9] rounded-xl space-y-3 md:col-span-2">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium">Did the coach demonstrate professional behaviour with students and
                      school staff?</span>
                    <div class="flex gap-2">
                      <button @click="form.professional_behavior = true"
                        :class="form.professional_behavior ? 'bg-[#005daa] text-white shadow-md' : 'bg-white text-slate-400'"
                        class="px-4 py-1.5 text-xs font-bold rounded-lg transition-all">Yes</button>
                      <button @click="form.professional_behavior = false"
                        :class="!form.professional_behavior ? 'bg-[#ba1a1a] text-white shadow-md' : 'bg-white text-slate-400'"
                        class="px-4 py-1.5 text-xs font-bold rounded-lg transition-all">No</button>
                    </div>
                  </div>
                  <textarea v-if="!form.professional_behavior" v-model="form.professional_behavior_why"
                    placeholder="If No, why?"
                    class="w-full text-xs border-none bg-white rounded-lg p-3 focus:ring-1 focus:ring-[#005daa] h-16 resize-none"></textarea>
                </div>
              </div>
            </div>

            <!-- Uniform Checklist -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
              <div>
                <label class="block text-xs font-bold text-[#404753] uppercase tracking-wider mb-4">Uniform
                  Checklist</label>
                <div class="space-y-3">
                  <div v-for="u in [
                    { label: 'T-shirt', model: 'uniform_tshirt_type', options: ['Proper MQ T-shirt', 'Non-MQ T-shirt'] },
                    { label: 'Lower/Track Pants', model: 'uniform_pants_type', options: ['MQ Track', 'Non-MQ Track'] },
                    { label: 'Shoes', model: 'uniform_shoes_type', options: ['Sports shoes', 'Non-sports shoes'] },
                    { label: 'Whistle', model: 'uniform_whistle_wearing', options: ['Wearing', 'Not Wearing'] }
                  ]" :key="u.label" class="flex items-center justify-between p-3 bg-[#f9f9f9] rounded-lg">
                    <span class="text-sm font-medium">{{ u.label }}:</span>
                    <select v-model="form[u.model]"
                      class="border-none bg-transparent text-[#005daa] font-bold text-sm focus:ring-0 cursor-pointer">
                      <option v-for="opt in u.options" :key="opt">{{ opt }}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold text-[#404753] uppercase tracking-wider mb-4">Grooming</label>
                <div class="p-4 bg-[#f9f9f9] rounded-xl space-y-4">
                  <div v-for="g in [
                    { label: 'Clean appearance', val: 'Clean appearance' },
                    { label: 'Needs improvement (visible hygiene issues)', val: 'Needs improvement' }
                  ]" :key="g.val" @click="form.grooming_type = g.val"
                    class="flex items-center gap-4 cursor-pointer group p-2 hover:bg-white rounded-lg transition-all">
                    <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                      :class="form.grooming_type === g.val ? 'border-[#005daa] bg-[#005daa]' : 'border-slate-300'">
                      <div v-if="form.grooming_type === g.val" class="w-2.5 h-2.5 bg-white rounded-full"></div>
                    </div>
                    <span class="text-sm font-medium"
                      :class="form.grooming_type === g.val ? 'font-bold text-[#005daa]' : ''">{{ g.label }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Equipment & Maintenance -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div class="space-y-4 md:col-span-2">
                <label class="block text-xs font-bold text-[#404753] uppercase tracking-wider">Equipment &
                  Maintenance</label>
                <p class="text-sm font-medium">Did all equipment meet required safety and maintenance standards?</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label v-for="check in [
                    { label: 'Equipment safe to use', model: 'equipment_safe', icon: 'verified' },
                    { label: 'Proper setup before session', model: 'proper_setup', icon: 'settings_input_component' }
                  ]" :key="check.model"
                    class="flex items-center justify-between p-4 bg-[#f9f9f9] rounded-xl cursor-pointer hover:bg-[#e8e8e8] transition-all">
                    <div class="flex items-center gap-3">
                      <span class="material-symbols-outlined text-slate-400">{{ check.icon }}</span>
                      <span class="text-sm font-medium">{{ check.label }}</span>
                    </div>
                    <input type="checkbox" v-model="form[check.model]"
                      class="rounded text-[#005daa] focus:ring-[#005daa] w-5 h-5" />
                  </label>
                </div>
              </div>
              <div class="space-y-4">
                <label class="block text-xs font-bold text-[#404753] uppercase tracking-wider">Student Engagement &
                  Learning</label>
                <label
                  class="flex items-center justify-between p-4 bg-[#f9f9f9] rounded-xl cursor-pointer hover:bg-[#e8e8e8] transition-all">
                  <span class="text-sm font-medium">Were students actively engaged throughout the session?</span>
                  <input type="checkbox" v-model="form.students_engaged_obs"
                    class="rounded text-[#005daa] focus:ring-[#005daa] w-5 h-5" />
                </label>
              </div>
              <div class="space-y-4">
                <label class="block text-xs font-bold text-[#404753] uppercase tracking-wider">Class Management &
                  Structure</label>
                <label
                  class="flex items-center justify-between p-4 bg-[#f9f9f9] rounded-xl cursor-pointer hover:bg-[#e8e8e8] transition-all">
                  <span class="text-sm font-medium">Did the coach manage discipline effectively without being
                    harsh?</span>
                  <input type="checkbox" v-model="form.discipline_effective"
                    class="rounded text-[#005daa] focus:ring-[#005daa] w-5 h-5" />
                </label>
              </div>
            </div>

            <!-- Team-Level Observations -->
            <div>
              <label class="block text-xs font-bold text-[#404753] uppercase tracking-wider mb-4">Team-Level
                Observations</label>
              <p class="text-sm font-medium mb-3">Common Observations across Coaches?</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-2">
                  <p class="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Positives –</p>
                  <textarea v-model="form.observations_pos"
                    class="w-full p-4 text-xs bg-[#f9f9f9] border-none rounded-2xl h-28 focus:ring-1 focus:ring-emerald-500 shadow-inner"
                    placeholder="List common positives..."></textarea>
                </div>
                <div class="space-y-2">
                  <p class="text-[10px] font-bold text-[#ba1a1a] uppercase tracking-widest">Negatives –</p>
                  <textarea v-model="form.observations_neg"
                    class="w-full p-4 text-xs bg-[#f9f9f9] border-none rounded-2xl h-28 focus:ring-1 focus:ring-[#ba1a1a] shadow-inner"
                    placeholder="List common negatives..."></textarea>
                </div>
              </div>
            </div>
          </section>

          <!-- Section B: Well-being & Concern -->
          <section class="bg-white rounded-xl p-6 lg:p-8 shadow-sm">
            <div class="flex items-center gap-3 mb-6">
              <span class="w-8 h-8 rounded-lg bg-[#afceff] flex items-center justify-center">
                <span class="material-symbols-outlined text-[#385782] text-lg">psychology</span>
              </span>
              <h2 class="text-xl font-bold font-['Manrope']">Section B: Coach Well-being & Logistics</h2>
            </div>

            <div class="space-y-8">
              <div class="space-y-4">
                <label class="text-sm font-bold text-[#404753]">Do coaches face any issues with:</label>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <button
                    v-for="issue in ['Accommodation', 'Travel / commute', 'Timings / workload', 'Laptop / device', 'Communication with school', 'No issues reported']"
                    :key="issue" @click="toggleItem(form.wellbeing_issues, issue)"
                    :class="form.wellbeing_issues.includes(issue) ? 'bg-[#385782] text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'"
                    class="px-4 py-2 rounded-xl text-[10px] font-bold border border-slate-100 transition-all text-left flex justify-between items-center">
                    {{ issue }}
                    <span v-if="form.wellbeing_issues.includes(issue)"
                      class="material-symbols-outlined text-xs">check_circle</span>
                  </button>
                </div>
              </div>

              <div class="p-6 bg-rose-50 rounded-2xl border border-rose-100 space-y-6">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="text-sm font-bold text-rose-900">Areas of Concern & Accountability</h3>
                    <p class="text-xs text-rose-700 mt-1">Did any coach fail to meet Marcos Quay standards?</p>
                  </div>
                  <div class="flex gap-2">
                    <button @click="form.fail_standards = true"
                      :class="form.fail_standards ? 'bg-[#ba1a1a] text-white shadow-md' : 'bg-white text-rose-600 border border-rose-100'"
                      class="px-6 py-2 text-xs font-bold rounded-xl transition-all">Yes</button>
                    <button @click="form.fail_standards = false"
                      :class="!form.fail_standards ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-emerald-600 border border-emerald-100'"
                      class="px-6 py-2 text-xs font-bold rounded-xl transition-all">No</button>
                  </div>
                </div>

                <div v-if="form.fail_standards" class="space-y-6 animate-in fade-in slide-in-from-top-4">
                  <div class="space-y-3">
                    <label class="text-[10px] font-bold uppercase text-rose-900 tracking-widest">Type of Concern
                      (Multi-select)</label>
                    <div class="flex flex-wrap gap-2">
                      <button
                        v-for="c in ['Punctuality issue', 'Uniform non-compliance', 'Poor session delivery', 'Lack of engagement', 'Discipline/behavior issue', 'Not following curriculum', 'Safety concern', 'Documentation / reporting issue']"
                        :key="c" @click="toggleItem(form.concern_types, c)"
                        :class="form.concern_types.includes(c) ? 'bg-[#ba1a1a] text-white' : 'bg-white text-rose-800 border border-rose-200'"
                        class="px-4 py-2 text-[10px] font-bold rounded-full transition-all">
                        {{ c }}
                      </button>
                    </div>
                  </div>
                  <div class="space-y-2">
                    <label class="text-xs font-bold text-rose-900">Are any disciplinary actions recommended? If yes,
                      specify:</label>
                    <textarea v-model="form.disciplinary_recommendations"
                      class="w-full p-4 text-xs bg-white border border-rose-100 rounded-2xl h-24 focus:ring-rose-500"
                      placeholder="Specify actions..."></textarea>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Section C: Stakeholders -->
          <section class="bg-white rounded-xl p-6 lg:p-8 shadow-sm">
            <div class="flex items-center gap-3 mb-6">
              <span class="w-8 h-8 rounded-lg bg-[#274871] flex items-center justify-center">
                <span class="material-symbols-outlined text-[#d4e3ff] text-lg">groups</span>
              </span>
              <h2 class="text-xl font-bold font-['Manrope']">Section C: Stakeholder Feedback</h2>
            </div>

            <div class="space-y-6">
              <div class="space-y-3">
                <label class="text-xs font-bold text-[#404753] uppercase">Stakeholder Type (Select one or more)</label>
                <div class="flex flex-wrap gap-2">
                  <button v-for="t in ['Principal', 'Trustee / Management', 'Parent', 'Student', 'Coaches']" :key="t"
                    @click="toggleItem(form.stakeholder_types, t)"
                    :class="form.stakeholder_types.includes(t) ? 'bg-[#274871] text-white shadow-md' : 'bg-slate-50 text-slate-500'"
                    class="px-4 py-2 rounded-xl text-[10px] font-bold border border-slate-100 transition-all">
                    {{ t }}
                  </button>
                </div>
              </div>

              <div class="space-y-4">
                <label class="text-xs font-bold text-[#404753] uppercase">Stakeholder Details</label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="flex items-center gap-3">
                    <span class="text-xs font-medium">Name:</span>
                    <input v-model="form.stakeholder_name" type="text"
                      class="flex-grow p-3 text-xs bg-slate-50 border-none rounded-xl focus:ring-1 focus:ring-[#274871]" />
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-xs font-medium">Designation:</span>
                    <input v-model="form.stakeholder_designation" type="text"
                      class="flex-grow p-3 text-xs bg-slate-50 border-none rounded-xl focus:ring-1 focus:ring-[#274871]" />
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-xs font-bold text-[#404753] uppercase">Key points discussed:</label>
                <textarea v-model="form.stakeholder_points"
                  class="w-full p-4 text-xs bg-slate-50 border-none rounded-2xl h-24 focus:ring-1 focus:ring-[#274871] resize-none"></textarea>
              </div>

              <div class="space-y-4">
                <label class="text-xs font-bold text-[#404753] uppercase">Feedback on Marcos Quay Program</label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <p class="text-[10px] font-bold text-emerald-600 uppercase">Positive feedback shared by the
                      stakeholder -</p>
                    <textarea v-model="form.stakeholder_pos_feedback"
                      class="w-full p-4 text-xs bg-emerald-50 border-none rounded-2xl h-32 focus:ring-1 focus:ring-emerald-500 resize-none"></textarea>
                  </div>
                  <div class="space-y-2">
                    <p class="text-[10px] font-bold text-[#ba1a1a] uppercase">Concerns or issues raised -</p>
                    <textarea v-model="form.stakeholder_concerns"
                      class="w-full p-4 text-xs bg-rose-50 border-none rounded-2xl h-32 focus:ring-1 focus:ring-rose-500 resize-none"></textarea>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Section D: School Relationship -->
          <section class="bg-white rounded-xl p-6 lg:p-8 shadow-sm">
            <div class="flex items-center gap-3 mb-6">
              <span class="w-8 h-8 rounded-lg bg-[#005daa]/10 flex items-center justify-center">
                <span class="material-symbols-outlined text-[#005daa] text-lg">handshake</span>
              </span>
              <h2 class="text-xl font-bold font-['Manrope']">Section D: School Relationship & Satisfaction Insights</h2>
            </div>

            <div class="space-y-8">
              <div class="space-y-4">
                <label class="text-sm font-bold text-[#404753]">How would the school rate their satisfaction with our
                  program?</label>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button v-for="r in ['Very Satisfied', 'Satisfied', 'Neutral', 'Not Satisfied']" :key="r"
                    @click="form.satisfaction_rating = r"
                    :class="form.satisfaction_rating === r ? 'bg-[#005daa] text-white shadow-md' : 'bg-slate-50 text-slate-500 border border-slate-100'"
                    class="px-4 py-4 rounded-2xl text-xs font-bold transition-all text-center">
                    {{ r }}
                  </button>
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-bold text-[#404753]">Is the school expecting any new initiatives from us? If
                  yes, summarize.</label>
                <textarea v-model="form.new_initiatives"
                  class="w-full p-4 text-xs bg-[#f9f9f9] border-none rounded-2xl h-28 focus:ring-1 focus:ring-[#005daa] resize-none"></textarea>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-bold text-[#404753]">Are there any complaints or concerns that need urgent
                  attention?</label>
                <textarea v-model="form.urgent_complaints"
                  class="w-full p-4 text-xs bg-rose-50 text-[#ba1a1a] border border-rose-100 rounded-2xl h-28 focus:ring-1 focus:ring-[#ba1a1a] resize-none"></textarea>
              </div>
            </div>
          </section>

          <!-- Section E: Sentiment -->
          <section class="bg-white rounded-xl p-6 lg:p-8 shadow-sm">
            <div class="flex items-center gap-3 mb-6">
              <span class="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <span class="material-symbols-outlined text-amber-600 text-lg">sentiment_satisfied</span>
              </span>
              <h2 class="text-xl font-bold font-['Manrope']">Section E: Student & Parent Sentiment</h2>
            </div>

            <div class="space-y-8">
              <div class="space-y-4">
                <label class="text-sm font-bold text-[#404753]">Student Engagement Level (Based on observation)</label>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button v-for="l in [
                    { label: 'Highly excited (active participation, enthusiasm visible)', val: 'Highly excited' },
                    { label: 'Moderately engaged (participating but inconsistent energy)', val: 'Moderately engaged' },
                    { label: 'Low engagement (disinterest / low participation)', val: 'Low engagement' }
                  ]" :key="l.val" @click="form.engagement_level = l.val"
                    :class="form.engagement_level === l.val ? 'bg-[#005daa] text-white shadow-md' : 'bg-slate-50 text-slate-500'"
                    class="px-4 py-4 rounded-2xl text-[10px] font-bold text-left transition-all border border-slate-50">
                    {{ l.label }}
                  </button>
                </div>
              </div>

              <div class="flex items-center justify-between p-6 bg-[#f9f9f9] rounded-2xl border border-slate-100">
                <span class="text-sm font-bold text-[#404753]">Did coach take Students safety and security measures
                  during ground activities?</span>
                <div class="flex gap-2">
                  <button @click="form.safety_measures_taken = true"
                    :class="form.safety_measures_taken ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-emerald-600 border border-emerald-100'"
                    class="px-6 py-2 text-xs font-bold rounded-xl transition-all">Yes</button>
                  <button @click="form.safety_measures_taken = false"
                    :class="!form.safety_measures_taken ? 'bg-[#ba1a1a] text-white shadow-md' : 'bg-white text-rose-600 border border-rose-100'"
                    class="px-6 py-2 text-xs font-bold rounded-xl transition-all">No</button>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div class="space-y-2">
                  <label class="text-sm font-bold text-[#404753]">Have parents shared any feedback about the
                    program?</label>
                  <p class="text-[10px] text-slate-400 italic">If yes, summarize or Testimonies -</p>
                  <textarea v-model="form.parent_testimonies"
                    class="w-full p-4 text-xs bg-[#f9f9f9] border-none rounded-2xl h-32 focus:ring-1 focus:ring-[#005daa] resize-none"></textarea>
                </div>
                <div class="space-y-2">
                  <label class="text-sm font-bold text-[#404753]">Are students asking for more training, competitions,
                    or additional sports?</label>
                  <textarea v-model="form.student_requests"
                    class="w-full p-4 text-xs bg-[#f9f9f9] border-none rounded-2xl h-32 focus:ring-1 focus:ring-[#005daa] resize-none"></textarea>
                </div>
              </div>
            </div>
          </section>

          <!-- Section F: Plans & Growth -->
          <section class="bg-white rounded-xl p-6 lg:p-8 shadow-sm">
            <div class="flex items-center gap-3 mb-6">
              <span class="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <span class="material-symbols-outlined text-emerald-600 text-lg">event_available</span>
              </span>
              <h2 class="text-xl font-bold font-['Manrope']">Section F: Upcoming School Plans & Events</h2>
            </div>

            <div class="space-y-8">
              <div class="space-y-4">
                <label class="text-sm font-bold text-[#404753]">Are there any upcoming events where Marcos Quay may be
                  involved?</label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div class="space-y-1">
                    <p class="text-[10px] font-bold text-slate-400 uppercase">Event Name:</p>
                    <input v-model="form.upcoming_event_name" type="text"
                      class="w-full p-4 bg-[#f9f9f9] border-none rounded-2xl text-xs focus:ring-1 focus:ring-[#005daa]" />
                  </div>
                  <div class="space-y-1">
                    <p class="text-[10px] font-bold text-slate-400 uppercase">Expected Date:</p>
                    <input v-model="form.upcoming_event_date" type="date"
                      class="w-full p-4 bg-[#f9f9f9] border-none rounded-2xl text-xs focus:ring-1 focus:ring-[#005daa]" />
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-sm font-bold text-[#404753]">What support is expected from Marcos Quay?</label>
                <textarea v-model="form.mq_support_expected"
                  class="w-full p-4 text-xs bg-[#f9f9f9] border-none rounded-2xl h-24 focus:ring-1 focus:ring-[#005daa] resize-none"></textarea>
              </div>

              <div class="space-y-6 pt-4 border-t border-slate-50">
                <h3 class="text-lg font-bold font-['Manrope'] text-emerald-700">Growth Opportunities for Marcos Quay
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div class="space-y-4">
                    <label class="text-sm font-bold text-[#404753]">Is there potential to expand Marcos Quay presence in
                      the school?</label>
                    <div class="space-y-2">
                      <button v-for="p in [
                        { label: 'Yes – High potential', val: 'High potential' },
                        { label: 'Limited scope', val: 'Limited scope' },
                        { label: 'No immediate opportunity', val: 'No immediate opportunity' }
                      ]" :key="p.val" @click="form.growth_potential = p.val"
                        :class="form.growth_potential === p.val ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 text-slate-500'"
                        class="w-full px-4 py-3 rounded-xl text-xs font-bold text-left transition-all border border-slate-50">
                        {{ p.label }}
                      </button>
                    </div>
                  </div>
                  <div class="space-y-4">
                    <div class="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-4">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-bold text-emerald-900">Does the school require support in sports
                          infrastructure?</span>
                        <div class="flex gap-2">
                          <button @click="form.infra_support_needed = true"
                            :class="form.infra_support_needed ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-emerald-600 border border-emerald-100'"
                            class="px-4 py-1.5 text-xs font-bold rounded-lg transition-all">Yes</button>
                          <button @click="form.infra_support_needed = false"
                            :class="!form.infra_support_needed ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-emerald-600 border border-emerald-100'"
                            class="px-4 py-1.5 text-xs font-bold rounded-lg transition-all">No</button>
                        </div>
                      </div>
                      <textarea v-if="form.infra_support_needed" v-model="form.infra_requirements"
                        placeholder="If yes, specify requirement:"
                        class="w-full p-4 text-xs bg-white border border-emerald-100 rounded-xl h-24 focus:ring-emerald-500 resize-none"></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- Section G: Warning Signs -->
          <section class="bg-white rounded-xl p-6 lg:p-8 shadow-sm border-l-4 border-rose-500">
            <div class="flex items-center gap-3 mb-6">
              <span class="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                <span class="material-symbols-outlined text-rose-500 text-lg">report_problem</span>
              </span>
              <h2 class="text-xl font-bold font-['Manrope'] text-rose-900">Section G: Concern Indicators</h2>
            </div>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-6 bg-rose-50/30 rounded-2xl border border-rose-100">
                <div>
                  <p class="text-sm font-bold text-rose-900">Any Early Warning Signs Observed? Brief Description</p>
                  <p class="text-[10px] text-rose-700 italic mt-1">Check Yes if you noticed any concerning patterns.</p>
                </div>
                <div class="flex gap-2">
                  <button @click="form.warning_signs_observed = true"
                    :class="form.warning_signs_observed ? 'bg-[#ba1a1a] text-white shadow-md' : 'bg-white text-rose-600 border border-rose-100'"
                    class="px-6 py-2 text-xs font-bold rounded-xl transition-all">Yes</button>
                  <button @click="form.warning_signs_observed = false"
                    :class="!form.warning_signs_observed ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-emerald-600 border border-emerald-100'"
                    class="px-6 py-2 text-xs font-bold rounded-xl transition-all">No</button>
                </div>
              </div>
              <textarea v-if="form.warning_signs_observed" v-model="form.warning_signs_desc"
                placeholder="Describe the early warning signs..."
                class="w-full p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs h-32 focus:ring-1 focus:ring-[#ba1a1a] resize-none"></textarea>
            </div>
          </section>

          <!-- Section H: Visit Insights -->
          <section class="bg-[#1a1c1c] text-white rounded-3xl p-8 lg:p-12 shadow-2xl relative overflow-hidden">
            <div class="relative z-10">
              <div class="flex items-center gap-4 mb-10">
                <div
                  class="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/20">
                  <span class="material-symbols-outlined text-[#1a1c1c] text-3xl">lightbulb</span>
                </div>
                <div>
                  <h2 class="text-2xl font-bold font-['Manrope']">Section H: Visit Insights</h2>
                  <p class="text-slate-400 text-xs font-medium uppercase tracking-widest">(Critical for Management)</p>
                </div>
              </div>
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div class="space-y-6">
                  <label class="text-xs font-bold uppercase text-slate-500 tracking-widest">Top 3 insights from this
                    school visit:</label>
                  <div v-for="i in 3" :key="i" class="flex gap-4 items-start group">
                    <span
                      class="text-4xl font-black text-slate-800 transition-all group-focus-within:text-amber-400 group-focus-within:scale-110">{{
                      i }}</span>
                    <textarea v-model="form['insight_' + i]" :placeholder="'Critical insight #' + i"
                      class="flex-grow p-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:ring-1 focus:ring-amber-400 transition-all h-20 resize-none"></textarea>
                  </div>
                </div>
                <div class="space-y-8">
                  <div class="space-y-2">
                    <label class="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Immediate action
                      required from HQ (if any):</label>
                    <textarea v-model="form.hq_immediate_action"
                      class="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-sm h-32 focus:ring-1 focus:ring-rose-400 resize-none"></textarea>
                  </div>
                  <div class="space-y-2">
                    <label class="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Long-term
                      opportunity identified:</label>
                    <textarea v-model="form.long_term_opportunity"
                      class="w-full p-6 bg-white/5 border border-white/10 rounded-2xl text-sm h-32 focus:ring-1 focus:ring-emerald-400 resize-none"></textarea>
                  </div>
                </div>
              </div>
            </div>
            <div class="absolute -right-20 -top-20 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl"></div>
            <div class="absolute -left-20 -bottom-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
          </section>

          <!-- Section I: Overall Coach Performance -->
          <section class="bg-white rounded-3xl p-10 shadow-sm border border-slate-100">
            <div class="flex flex-col md:flex-row items-center justify-between gap-10">
              <div>
                <h2 class="text-2xl font-bold font-['Manrope'] mb-2">Section I: Overall Coach Performance</h2>
                <p class="text-sm text-[#404753]">Final assessment of the coach based on the current audit visit.</p>
              </div>
              <div class="flex flex-wrap justify-center gap-4">
                <label v-for="opt in performanceOptions" :key="opt" class="relative cursor-pointer group">
                  <input type="radio" :value="opt" v-model="form.overall_performance" class="peer sr-only" />
                  <div
                    class="px-8 py-5 rounded-2xl border-2 border-[#c0c7d6] peer-checked:border-[#005daa] peer-checked:bg-[#005daa] peer-checked:text-white transition-all group-hover:bg-[#f9f9f9] group-hover:border-[#005daa]/30 shadow-sm">
                    <p class="text-center text-xs font-bold uppercase tracking-widest">{{ opt }}</p>
                  </div>
                </label>
              </div>
            </div>
          </section>

          <!-- Action Bar -->
          <div class="flex items-center justify-end gap-6 pb-24">
            <button
              class="flex items-center gap-2 text-[#404753] font-semibold hover:text-[#005daa] transition-colors group">
              <span class="material-symbols-outlined group-hover:scale-110 transition-transform">print</span>
              Print Summary
            </button>
            <button @click="submitChecklist" :disabled="submitting"
              class="px-16 py-6 bg-[#005daa] text-white rounded-3xl font-bold shadow-2xl shadow-[#005daa]/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 disabled:opacity-50">
              <span v-if="submitting" class="material-symbols-outlined animate-spin">refresh</span>
              <span class="uppercase tracking-widest text-sm">{{ submitting ? 'Saving...' : (editingId ? 'Update Audit Report' : 'Submit Final Audit') }}</span>
              <span v-if="!submitting" class="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>

      <!-- MOM Form View -->
      <div v-else-if="viewMode === 'mom_form'" class="max-w-4xl mx-auto">
        <header class="mb-10">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <nav class="flex gap-2 text-xs font-medium text-[#404753] mb-2">
                <button @click="viewMode = 'list'; listTab = 'moms'" class="hover:text-[#005daa] transition-colors">MOMs</button>
                <span class="material-symbols-outlined text-[10px]">arrow_forward_ios</span>
                <span>{{ editingId ? 'Edit' : 'Add' }} MOM</span>
              </nav>
              <h1 class="text-3xl font-extrabold font-['Manrope'] tracking-tight text-[#1a1c1c]">
                {{ editingId ? 'Edit Minutes of Meeting' : 'New Minutes of Meeting' }}
              </h1>
              <p class="text-[#404753] text-sm mt-1">
                <span class="font-semibold text-[#005daa]" v-if="momForm.school_name">{{ momForm.school_name }}</span>
                <span class="italic text-slate-400" v-else>Select a school below</span>
              </p>
            </div>
            <div class="flex gap-3">
              <button @click="viewMode = 'list'; listTab = 'moms'"
                class="px-5 py-2 text-sm font-semibold rounded-lg bg-[#f3f3f3] text-[#404753] hover:bg-[#e8e8e8] transition-all">Cancel</button>
            </div>
          </div>
        </header>

        <div class="space-y-8 pb-20">
          <section class="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h2 class="text-xl font-bold font-['Manrope'] mb-6 text-[#1a1c1c]">Meeting Details</h2>
            <div class="grid md:grid-cols-2 gap-6">
              <div class="space-y-2">
                <label class="text-xs font-bold text-[#404753] uppercase tracking-widest">Select Target School *</label>
                <div class="relative">
                  <select v-model="momForm.school_id" @change="onMomSchoolChange"
                    class="w-full pl-12 pr-4 py-4 bg-[#f9f9f9] border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#005daa] focus:border-transparent appearance-none">
                    <option :value="null">-- Choose a school --</option>
                    <option v-for="s in schools" :key="s.id" :value="s.id">{{ s.name }}</option>
                  </select>
                  <span
                    class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">domain</span>
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold text-[#404753] uppercase tracking-widest">Person Met With *</label>
                <div class="relative">
                  <input type="text" v-model="momForm.person_met" placeholder="E.g., Principal, Sports Coordinator"
                    class="w-full pl-12 pr-4 py-4 bg-[#f9f9f9] border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-[#005daa] focus:border-transparent" />
                  <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">person</span>
                </div>
              </div>
            </div>
          </section>

          <section class="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
            <h2 class="text-xl font-bold font-['Manrope'] mb-6 text-[#1a1c1c]">Discussion & Feedback</h2>
            <div class="space-y-6">
              <div class="space-y-2">
                <label class="text-xs font-bold text-[#404753] uppercase tracking-widest">Meeting Concerns</label>
                <textarea v-model="momForm.meeting_concerns" placeholder="Concerns raised during the meeting..."
                  class="w-full p-4 bg-[#f9f9f9] border border-slate-200 rounded-2xl text-sm h-32 focus:ring-2 focus:ring-[#005daa] resize-none"></textarea>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold text-[#404753] uppercase tracking-widest">Coach's Concerns</label>
                <textarea v-model="momForm.coach_concerns" placeholder="Concerns raised by the coach..."
                  class="w-full p-4 bg-[#f9f9f9] border border-slate-200 rounded-2xl text-sm h-32 focus:ring-2 focus:ring-[#005daa] resize-none"></textarea>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold text-[#404753] uppercase tracking-widest">Consensus Reached</label>
                <textarea v-model="momForm.consensus" placeholder="What was agreed upon..."
                  class="w-full p-4 bg-[#f9f9f9] border border-slate-200 rounded-2xl text-sm h-32 focus:ring-2 focus:ring-[#005daa] resize-none"></textarea>
              </div>
              <div class="space-y-2">
                <label class="text-xs font-bold text-[#404753] uppercase tracking-widest">MOM Summary</label>
                <textarea v-model="momForm.mom_summary" placeholder="Summary of the minutes of meeting..."
                  class="w-full p-4 bg-[#f9f9f9] border border-slate-200 rounded-2xl text-sm h-32 focus:ring-2 focus:ring-[#005daa] resize-none"></textarea>
              </div>
            </div>
          </section>

          <div class="flex items-center justify-end gap-6 pb-10">
            <button @click="submitMom" :disabled="submitting"
              class="px-16 py-6 bg-[#005daa] text-white rounded-3xl font-bold shadow-2xl shadow-[#005daa]/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-4 disabled:opacity-50">
              <span v-if="submitting" class="material-symbols-outlined animate-spin">refresh</span>
              <span class="uppercase tracking-widest text-sm">{{ submitting ? 'Saving...' : (editingId ? 'Update MOM' : 'Submit MOM') }}</span>
              <span v-if="!submitting" class="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Background Decoration -->
    <div
      class="fixed top-0 right-0 -z-10 w-1/3 h-full bg-gradient-to-l from-slate-100/40 to-transparent pointer-events-none">
    </div>
    <div
      class="fixed bottom-0 left-0 -z-10 w-1/4 h-1/2 bg-gradient-to-tr from-slate-100/30 to-transparent pointer-events-none">
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');

.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: #f3f3f3;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #005daa;
  border-radius: 10px;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(30%) sepia(90%) saturate(1000%) hue-rotate(190deg);
  cursor: pointer;
}

textarea {
  font-family: inherit;
}
</style>
