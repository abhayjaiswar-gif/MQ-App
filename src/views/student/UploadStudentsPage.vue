<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

// Mock interactive logic for standard inputs and upload box
const handleDownloadTemplate = () => {
    alert("Downloading template... (Mock)");
};

const handleUploadClick = () => {
    alert("Opening file selector... (Mock)");
};
</script>

<template>
  <div class="px-2 py-8 tailwind-wrapper min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-inter">
    <div class="max-w-6xl mx-auto w-full p-4 sm:p-8">
      
      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h3 class="text-3xl font-extrabold text-[#1e293b] tracking-tight mb-2 font-manrope">Upload Students (Batch)</h3>
          <p class="text-slate-500 text-sm">Bulk import student records via CSV or Excel templates directly into the registry.</p>
        </div>
        <button @click="router.push('/student')" class="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-bold text-sm shadow-sm flex items-center gap-2 font-manrope">
          <span class="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Directory
        </button>
      </div>

      <div class="space-y-8 pb-20">
        <!-- Bento Grid Section: Steps 1 & 2 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Step 1: Template Download -->
            <section class="md:col-span-1 bg-white p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between h-full">
                <div>
                    <div class="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                        <span class="material-symbols-outlined text-primary text-[24px]">download_for_offline</span>
                    </div>
                    <h3 class="font-manrope font-bold text-lg text-slate-800 mb-2">Step 1: Get Template</h3>
                    <p class="text-sm text-slate-500 mb-8 leading-relaxed">Download the standard Excel format. Ensure all mandatory fields are filled correctly to avoid validation errors during import.</p>
                </div>
                <button @click="handleDownloadTemplate" class="w-full py-3.5 bg-white border-2 border-primary text-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/5 transition-all active:scale-[0.98] font-manrope uppercase tracking-widest text-xs">
                    <span class="material-symbols-outlined text-lg">download</span>
                    Download Template
                </button>
            </section>

            <!-- Step 2: Batch Selection -->
            <section class="md:col-span-2 bg-white p-6 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100 h-full">
                <div class="flex items-center gap-4 mb-8">
                    <div class="w-12 h-12 bg-[#40608b]/10 rounded-xl flex items-center justify-center">
                        <span class="material-symbols-outlined text-[#40608b] text-[24px]">account_tree</span>
                    </div>
                    <div>
                        <h3 class="font-manrope font-bold text-lg text-slate-800">Step 2: Batch Context</h3>
                        <p class="text-sm text-slate-500">Define where these students will be enrolled.</p>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="space-y-2">
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">School</label>
                        <select class="w-full bg-slate-50 border-none rounded-xl text-sm px-4 py-3.5 focus:ring-2 focus:ring-primary/20 font-bold text-slate-700 outline-none appearance-none cursor-pointer">
                            <option>St. Mary's Academy</option>
                            <option>Greenwood High</option>
                            <option>Riverside International</option>
                        </select>
                    </div>
                    <div class="space-y-2">
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Standard</label>
                        <select class="w-full bg-slate-50 border-none rounded-xl text-sm px-4 py-3.5 focus:ring-2 focus:ring-primary/20 font-bold text-slate-700 outline-none appearance-none cursor-pointer">
                            <option>Grade 8</option>
                            <option>Grade 9</option>
                            <option>Grade 10</option>
                        </select>
                    </div>
                    <div class="space-y-2">
                        <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-manrope">Division</label>
                        <select class="w-full bg-slate-50 border-none rounded-xl text-sm px-4 py-3.5 focus:ring-2 focus:ring-primary/20 font-bold text-slate-700 outline-none appearance-none cursor-pointer">
                            <option>Division A</option>
                            <option>Division B</option>
                            <option>Division C</option>
                        </select>
                    </div>
                </div>
            </section>
        </div>

        <!-- Step 3: Drag & Drop Area -->
        <section class="bg-white p-2 rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100">
            <div @click="handleUploadClick" class="cursor-pointer border-2 border-dashed border-slate-200 hover:border-primary/50 hover:bg-slate-50/50 rounded-xl p-16 flex flex-col items-center justify-center text-center transition-all group">
                <div class="w-20 h-20 bg-primary/5 group-hover:bg-primary/10 transition-colors rounded-full flex items-center justify-center mb-6">
                    <span class="material-symbols-outlined text-primary text-[40px]">upload_file</span>
                </div>
                <h3 class="font-manrope font-bold text-slate-800 text-xl mb-2">Step 3: Upload File</h3>
                <p class="text-slate-500 text-sm max-w-sm">Drag and drop your completed student list here, or <span class="text-primary font-bold group-hover:underline">browse files</span>.</p>
                <p class="text-[10px] text-slate-400 mt-6 font-bold uppercase tracking-widest font-manrope">Supports .XLSX, .CSV up to 10MB</p>
            </div>
        </section>
      </div>

    </div>
  </div>
</template>
