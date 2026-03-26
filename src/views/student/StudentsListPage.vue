<script setup>
import { ref, computed, onMounted } from 'vue';

const activeTab = ref('all');
const searchQuery = ref('');
const selectedSchool = ref('All Branches');
const selectedStandard = ref('All Standards');
const studentsList = ref([]);
const loading = ref(true);

const currentPage = ref(1);
const perPage = ref(10);

// Dynamic Filter Lists
const availableSchools = ref([]);
const availableStandards = ref([]);
const divisions = ref([]);
const selectedDivisions = ref([]);

// --- Add Student Modal ---
const showAddModal = ref(false);
const addLoading = ref(false);
const schoolsForModal = ref([]);
const addForm = ref({
  name: '',
  gender: 'Male',
  school_name: '',
  standard: '',
  division: '',
  gr_number: '',
  mq_id: ''
});

const fetchSchoolsForModal = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/schools');
    const data = await res.json();
    if (data.success) schoolsForModal.value = data.schools;
  } catch (e) { console.error('Error loading schools:', e); }
};

const openAddModal = () => {
  addForm.value = { name: '', gender: 'Male', school_name: '', standard: '', division: '', gr_number: '', mq_id: '' };
  showAddModal.value = true;
};

const submitAddStudent = async () => {
  addLoading.value = true;
  try {
    const res = await fetch('http://localhost:3000/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...addForm.value, status: 'Active' })
    });
    const data = await res.json();
    if (data.success) {
      showAddModal.value = false;
      fetchStudents();
    } else {
      alert('Failed: ' + data.message);
    }
  } catch (e) {
    alert('An error occurred.');
  } finally {
    addLoading.value = false;
  }
};
// --- Edit Student Modal ---
const showEditModal = ref(false);
const editLoading = ref(false);
const editForm = ref({
  id: null,
  name: '',
  gender: 'Male',
  school_name: '',
  standard: '',
  division: '',
  gr_number: '',
  mq_id: '',
  status: 'Active'
});

const openEditModal = (student) => {
  editForm.value = {
    id: student.id,
    name: student.name || '',
    gender: student.gender || 'Male',
    school_name: student.school_name || '',
    standard: student.std || '',
    division: student.division || '',
    gr_number: student.roll_number || '',
    mq_id: student.mq_id || '',
    status: (student.status === 1 || student.status === 'Active') ? 'Active' : 'Inactive'
  };
  showEditModal.value = true;
};

const submitEditStudent = async () => {
  editLoading.value = true;
  try {
    const res = await fetch(`http://localhost:3000/api/students/${editForm.value.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editForm.value.name,
        gender: editForm.value.gender,
        school_name: editForm.value.school_name,
        standard: editForm.value.standard,
        division: editForm.value.division,
        gr_number: editForm.value.gr_number,
        mq_id: editForm.value.mq_id,
        status: editForm.value.status
      })
    });
    const data = await res.json();
    if (data.success) {
      showEditModal.value = false;
      fetchStudents();
    } else {
      alert('Update failed: ' + data.message);
    }
  } catch (e) {
    alert('An error occurred.');
  } finally {
    editLoading.value = false;
  }
};
// --- End Edit Modal ---

const fetchStudents = async () => {
  loading.value = true;
  try {
    const res = await fetch('http://localhost:3000/api/students');
    const data = await res.json();

    if (data.success) {
      studentsList.value = data.students;
      divisions.value = data.filters.divisions;
      availableSchools.value = data.filters.schools;
      availableStandards.value = data.filters.standards;
    } else if (Array.isArray(data)) {
      studentsList.value = data;
    }
  } catch (error) {
    console.error('Error fetching students:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStudents();
  fetchSchoolsForModal();
});

const filteredStudents = computed(() => {
  return studentsList.value.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (s.mq_id && s.mq_id.toLowerCase().includes(searchQuery.value.toLowerCase()));
    const matchesSchool = selectedSchool.value === 'All Branches' || s.school_name === selectedSchool.value;
    const matchesStandard = selectedStandard.value === 'All Standards' || s.std === selectedStandard.value;
    const matchesDivision = selectedDivisions.value.length === 0 || selectedDivisions.value.includes(s.division);
    return matchesSearch && matchesSchool && matchesStandard && matchesDivision;
  });
});

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return filteredStudents.value.slice(start, start + perPage.value);
});

const totalPages = computed(() => Math.ceil(filteredStudents.value.length / perPage.value));

const getInitials = (name) => {
  if (!name) return 'S';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const getAvatarColor = (id) => {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-violet-100 text-violet-700',
    'bg-cyan-100 text-cyan-700'
  ];
  return colors[id % colors.length];
};

const toggleDivision = (div) => {
  if (selectedDivisions.value.includes(div)) {
    selectedDivisions.value = selectedDivisions.value.filter(d => d !== div);
  } else {
    selectedDivisions.value.push(div);
  }
};

const clearDivisions = () => {
  selectedDivisions.value = [];
};
</script>

<template>
  <div class="px-2 py-2 tailwind-wrapper min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-inter">
    <div class="max-w-7xl mx-auto p-4 sm:p-2">
      <!-- Header Section -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <nav
            class="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 font-manrope">
            <span>Academic Year 2023-24</span>
            <span class="material-symbols-outlined text-[14px]">chevron_right</span>
            <span class="text-primary">Student Directory</span>
          </nav>
          <h2 class="text-4xl font-extrabold text-[#1e293b] tracking-tight font-manrope">Students List</h2>
        </div>
        <div class="flex items-center gap-3">
          <button @click="$router.push('/student/upload')"
            class="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm font-manrope">
            <span class="material-symbols-outlined text-lg">upload</span>
            Upload Students
          </button>
          <button @click="openAddModal"
            class="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-[#004a88] shadow-xl shadow-primary/20 transition-all active:scale-95 font-manrope">
            <span class="material-symbols-outlined text-lg">add</span>
            Add Student
          </button>
        </div>
      </div>

      <!-- Filter Section (Bento Inspired) -->
      <section class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <!-- Primary Filters -->
        <div class="lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                <span class="material-symbols-outlined text-[20px]">filter_list</span>
              </div>
              <h3 class="font-bold text-lg text-slate-800 font-manrope">Refine Results</h3>
            </div>
            <div class="relative w-full sm:w-72">
              <span
                class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
              <input v-model="searchQuery" type="text" placeholder="Search ID or Name..."
                class="w-full pl-12 pr-4 py-3 bg-slate-50 border-none focus:bg-white focus:ring-2 focus:ring-primary/20 rounded-2xl text-sm font-inter transition-all outline-none" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">School
                Branch</label>
              <div class="relative">
                <select v-model="selectedSchool"
                  class="w-full bg-slate-50 border-none rounded-2xl py-3 pl-4 pr-10 text-sm font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-primary/20 outline-none">
                  <option>All Branches</option>
                  <option v-for="school in availableSchools" :key="school" :value="school">{{ school }}</option>
                </select>
                <span
                  class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
              </div>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Standard /
                Grade</label>
              <div class="relative">
                <select v-model="selectedStandard"
                  class="w-full bg-slate-50 border-none rounded-2xl py-3 pl-4 pr-10 text-sm font-bold text-slate-700 appearance-none focus:ring-2 focus:ring-primary/20 outline-none">
                  <option>All Standards</option>
                  <option v-for="std in availableStandards" :key="std" :value="std">{{ std }}</option>
                </select>
                <span
                  class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">unfold_more</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Division Multi-select (Right Bento Block) -->
        <div class="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div class="flex justify-between items-center mb-4">
            <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Divisions</label>
            <button @click="clearDivisions"
              class="text-[10px] font-bold text-primary hover:underline font-manrope uppercase tracking-widest">Clear
              All</button>
          </div>
          <div class="flex-1 overflow-y-auto max-h-40 pr-2 custom-scrollbar">
            <div class="flex flex-wrap gap-2">
              <button v-for="div in divisions" :key="div" @click="toggleDivision(div)" :class="[
                'px-4 py-2 text-xs font-bold rounded-xl border transition-all font-inter shadow-sm',
                selectedDivisions.includes(div)
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-primary/40 hover:text-primary'
              ]">
                {{ div }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Table Section -->
      <div
        class="bg-white rounded-[32px] shadow-[0_8px_32px_rgba(0,28,58,0.04)] overflow-hidden border border-slate-100">
        <div class="p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 class="font-manrope font-bold text-lg text-slate-800 flex items-center gap-3">
            <span class="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
            Student Records
            <span class="text-sm font-normal text-slate-400 ml-2">({{ filteredStudents.length }} total)</span>
          </h3>
          <div class="flex items-center gap-4">
            <button
              class="p-2.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all border border-slate-100">
              <span class="material-symbols-outlined text-[20px]">download</span>
            </button>
            <button @click="fetchStudents"
              class="p-2.5 text-slate-400 hover:text-primary hover:bg-slate-50 rounded-xl transition-all border border-slate-100">
              <span class="material-symbols-outlined text-[20px]">refresh</span>
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50">
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">
                  Student ID</th>
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Name
                </th>
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">School
                </th>
                <th
                  class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope text-center">
                  Standard</th>
                <th
                  class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope text-center">
                  Division</th>
                <th class="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Status
                </th>
                <th class="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <template v-if="loading">
                <tr>
                  <td colspan="7" class="py-24 text-center">
                    <div class="flex flex-col items-center gap-4">
                      <div class="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin"></div>
                      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Loading
                        Directory...</p>
                    </div>
                  </td>
                </tr>
              </template>
              <template v-else-if="paginatedStudents.length > 0">
                <tr v-for="student in paginatedStudents" :key="student.id"
                  class="hover:bg-slate-50/50 transition-colors group">
                  <td class="px-8 py-5">
                    <span class="font-manrope text-sm text-slate-400 font-bold tracking-tight">#{{ student.mq_id ||
                      'MQ-PEND' }}</span>
                  </td>
                  <td class="px-8 py-5">
                    <div class="flex items-center gap-4">
                      <div
                        :class="['w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold font-manrope', getAvatarColor(student.id)]">
                        {{ getInitials(student.name) }}
                      </div>
                      <span class="font-bold font-manrope text-slate-800 text-sm tracking-tight">{{ student.name
                      }}</span>
                    </div>
                  </td>
                  <td class="px-8 py-5">
                    <span class="text-[13px] font-medium text-slate-500 max-w-[200px] truncate block">{{
                      student.school_name || 'Unassigned' }}</span>
                  </td>
                  <td class="px-8 py-5 text-center">
                    <span
                      class="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">{{
                        student.std || '—' }}</span>
                  </td>
                  <td class="px-8 py-5 text-center">
                    <span class="text-xs font-bold text-slate-700">{{ student.division || '—' }}</span>
                  </td>
                  <td class="px-8 py-5">
                    <span v-if="student.status === 'Active' || student.status == 1"
                      class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100 font-manrope uppercase tracking-wider">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Active
                    </span>
                    <span v-else-if="student.status === 'Pending'"
                      class="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-100 font-manrope uppercase tracking-wider">
                      <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>Pending
                    </span>
                    <span v-else
                      class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full border border-slate-200 font-manrope uppercase tracking-wider">
                      <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>{{ student.status === 0 ? 'Inactive' :
                        (student.status || 'Inactive') }}
                    </span>
                  </td>
                  <td class="px-8 py-5 text-right">
                    <div class="flex items-center justify-end gap-1 transition-all">
                      <button @click="openEditModal(student)"
                        class="text-primary p-2 hover:bg-primary/5 rounded-xl transition-all border border-transparent hover:border-primary/10"
                        title="Edit Student">
                        <span class="material-symbols-outlined text-[20px]">edit_note</span>
                      </button>
                      <button
                        class="text-slate-400 p-2 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200"
                        title="View Student">
                        <span class="material-symbols-outlined text-[20px]">visibility</span>
                      </button>
                    </div>
                  </td>
                </tr>
              </template>
              <template v-else>
                <tr>
                  <td colspan="7" class="py-24 text-center opacity-50">
                    <div class="flex flex-col items-center gap-3">
                      <span class="material-symbols-outlined text-[48px] mb-2">person_search</span>
                      <p class="font-bold uppercase text-[10px] tracking-widest font-manrope text-slate-500">No students
                        match your criteria</p>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="p-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between">
          <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-manrope">
            Showing {{ filteredStudents.length ? (currentPage - 1) * perPage + 1 : 0 }} - {{ Math.min(currentPage *
              perPage,
              filteredStudents.length) }}
          </p>
          <div class="flex items-center gap-1" v-if="totalPages > 1">
            <button @click="currentPage--" :disabled="currentPage === 1"
              class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-50 hover:bg-slate-50 transition-colors">
              <span class="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <div
              class="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-primary font-manrope shadow-sm mx-2">
              {{ currentPage }} / {{ totalPages }}
            </div>
            <button @click="currentPage++" :disabled="currentPage === totalPages"
              class="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 disabled:opacity-50 hover:bg-slate-50 transition-colors">
              <span class="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Edit Student Modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showEditModal"
        class="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4"
        @click.self="showEditModal = false">
        <div class="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden">

          <!-- Header -->
          <div class="flex items-center justify-between px-8 py-5 border-b border-slate-100">
            <div>
              <h3 class="font-manrope font-extrabold text-xl text-slate-800">Edit Student</h3>
              <p class="text-slate-400 text-xs mt-0.5">Update the student's information below.</p>
            </div>
            <button @click="showEditModal = false" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
              <span class="material-symbols-outlined text-slate-500 text-[20px]">close</span>
            </button>
          </div>

          <!-- Form -->
          <form @submit.prevent="submitEditStudent" class="p-8 max-h-[80vh] overflow-y-auto">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

              <!-- School -->
              <div class="md:col-span-2">
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-2">School <span class="text-rose-500">*</span></label>
                <div class="relative">
                  <select v-model="editForm.school_name" required class="w-full border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm py-3.5 pl-4 pr-10 font-bold text-slate-700 outline-none appearance-none cursor-pointer">
                    <option value="" disabled>Select School</option>
                    <option v-for="s in schoolsForModal" :key="s.id" :value="s.name">{{ s.name }}</option>
                  </select>
                  <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </div>

              <!-- Std -->
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-2">Std <span class="text-rose-500">*</span></label>
                <div class="relative">
                  <select v-model="editForm.standard" required class="w-full border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm py-3.5 pl-4 pr-10 font-bold text-slate-700 outline-none appearance-none cursor-pointer">
                    <option value="" disabled>Select Std</option>
                    <option v-for="std in ['Nursery','Jr.Kg','Sr.Kg','LKG','UKG','1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th']" :key="std">{{ std }}</option>
                  </select>
                  <span class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </div>

              <!-- Division -->
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-2">Division</label>
                <input v-model="editForm.division" class="w-full border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm py-3.5 px-4 font-bold text-slate-700 outline-none" placeholder="e.g. A" type="text" />
              </div>

              <!-- Student Name -->
              <div class="md:col-span-2">
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-2">Student Name <span class="text-rose-500">*</span></label>
                <input v-model="editForm.name" required class="w-full border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm py-3.5 px-4 font-bold text-slate-700 outline-none" placeholder="Student Name" type="text" />
              </div>

              <!-- GR Number -->
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-2">GR Number</label>
                <input v-model="editForm.gr_number" class="w-full border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm py-3.5 px-4 font-bold text-slate-700 outline-none" placeholder="GR Number" type="text" />
              </div>

              <!-- MQ ID -->
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-2">MQ ID</label>
                <input v-model="editForm.mq_id" class="w-full border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm py-3.5 px-4 font-bold text-slate-700 outline-none" placeholder="MQ ID" type="text" />
              </div>

              <!-- Gender -->
              <div class="md:col-span-2">
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-2">Gender</label>
                <div class="flex gap-3">
                  <button type="button" v-for="g in ['Male', 'Female', 'Other']" :key="g" @click="editForm.gender = g"
                    :class="['px-6 py-2.5 rounded-xl border text-sm font-bold transition-all font-manrope', editForm.gender === g ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-primary/40 hover:text-primary']"
                  >{{ g }}</button>
                </div>
              </div>

              <!-- Status -->
              <div class="md:col-span-2">
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-2">Status</label>
                <div class="flex gap-3">
                  <button type="button" v-for="s in ['Active', 'Inactive']" :key="s" @click="editForm.status = s"
                    :class="['px-6 py-2.5 rounded-xl border text-sm font-bold transition-all font-manrope', editForm.status === s ? (s === 'Active' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-rose-600 text-white border-rose-600') : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300']"
                  >{{ s }}</button>
                </div>
              </div>

            </div>

            <!-- Footer -->
            <div class="flex justify-end gap-3 pt-6 mt-2 border-t border-slate-50">
              <button type="button" @click="showEditModal = false" class="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors font-manrope text-sm">Cancel</button>
              <button type="submit" :disabled="editLoading" class="px-8 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-[#004a88] shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center gap-2 font-manrope text-sm disabled:opacity-70">
                {{ editLoading ? 'Saving...' : 'Update Student' }}
                <span class="material-symbols-outlined text-[18px]" v-if="!editLoading">save</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Add Student Modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showAddModal"
        class="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4"
        @click.self="showAddModal = false">
        <div
          class="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden transform transition-all">

          <!-- Modal Header -->
          <div class="flex items-center justify-between px-8 py-5 border-b border-slate-100">
            <div>
              <h3 class="font-manrope font-extrabold text-xl text-slate-800">Add New Student</h3>
              <p class="text-slate-400 text-xs mt-0.5">Fill in the fields below to register a student.</p>
            </div>
            <button @click="showAddModal = false"
              class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors">
              <span class="material-symbols-outlined text-slate-500 text-[20px]">close</span>
            </button>
          </div>

          <!-- Modal Body -->
          <form @submit.prevent="submitAddStudent" class="p-8 max-h-[80vh] overflow-y-auto">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

              <!-- School -->
              <div class="md:col-span-2">
                <label
                  class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-2">School
                  <span class="text-rose-500">*</span></label>
                <div class="relative">
                  <select v-model="addForm.school_name" required
                    class="w-full border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm py-3.5 pl-4 pr-10 font-bold text-slate-700 outline-none transition-all appearance-none cursor-pointer">
                    <option value="" disabled>Select School</option>
                    <option v-for="s in schoolsForModal" :key="s.id" :value="s.name">{{ s.name }}</option>
                  </select>
                  <span
                    class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </div>

              <!-- Std -->
              <div>
                <label
                  class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-2">Std
                  <span class="text-rose-500">*</span></label>
                <div class="relative">
                  <select v-model="addForm.standard" required
                    class="w-full border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm py-3.5 pl-4 pr-10 font-bold text-slate-700 outline-none appearance-none cursor-pointer">
                    <option value="" disabled>Select Std</option>
                    <option
                      v-for="std in ['Nursery', 'Jr.Kg', 'Sr.Kg', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th']"
                      :key="std">{{ std }}</option>
                  </select>
                  <span
                    class="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                </div>
              </div>

              <!-- Division -->
              <div>
                <label
                  class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-2">Division</label>
                <input v-model="addForm.division"
                  class="w-full border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm py-3.5 px-4 font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                  placeholder="e.g. A" type="text" />
              </div>

              <!-- Student Name -->
              <div class="md:col-span-2">
                <label
                  class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-2">Student
                  Name <span class="text-rose-500">*</span></label>
                <input v-model="addForm.name" required
                  class="w-full border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm py-3.5 px-4 font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                  placeholder="Student Name" type="text" />
              </div>

              <!-- GR Number -->
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-2">GR
                  Number</label>
                <input v-model="addForm.gr_number"
                  class="w-full border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm py-3.5 px-4 font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                  placeholder="GR Number" type="text" />
              </div>

              <!-- MQ ID -->
              <div>
                <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-2">MQ
                  ID</label>
                <input v-model="addForm.mq_id"
                  class="w-full border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm py-3.5 px-4 font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
                  placeholder="MQ ID" type="text" />
              </div>

              <!-- Gender -->
              <div class="md:col-span-2">
                <label
                  class="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope mb-2">Gender</label>
                <div class="flex gap-3">
                  <button type="button" v-for="g in ['Male', 'Female', 'Other']" :key="g" @click="addForm.gender = g"
                    :class="[
                      'px-6 py-2.5 rounded-xl border text-sm font-bold transition-all font-manrope',
                      addForm.gender === g ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-primary/40 hover:text-primary'
                    ]">{{ g }}</button>
                </div>
              </div>

            </div>

            <!-- Modal Footer -->
            <div class="flex justify-end gap-3 pt-6 mt-2 border-t border-slate-50">
              <button type="button" @click="showAddModal = false"
                class="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors font-manrope text-sm">
                Cancel
              </button>
              <button type="submit" :disabled="addLoading"
                class="px-8 py-2.5 rounded-xl font-bold text-white bg-primary hover:bg-[#004a88] shadow-xl shadow-primary/20 active:scale-95 transition-all flex items-center gap-2 font-manrope text-sm disabled:opacity-70">
                {{ addLoading ? 'Saving...' : 'Register Student' }}
                <span class="material-symbols-outlined text-[18px]" v-if="!addLoading">how_to_reg</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>

</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 20px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
