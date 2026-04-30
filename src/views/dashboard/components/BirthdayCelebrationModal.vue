<template>
  <v-dialog v-model="visible" persistent max-width="500" class="birthday-modal">
    <v-card class="celebration-card overflow-hidden">
      <!-- Festive Background -->
      <div class="festive-header p-10 relative flex flex-col items-center justify-center text-center">
        <!-- Confetti Animation Placeholder (CSS-based) -->
        <div class="confetti-container absolute inset-0 pointer-events-none"></div>
        
        <!-- 3D Birthday Icon -->
        <div class="cake-container mb-6 animate-bounce-gentle">
          <span class="material-symbols-outlined text-7xl text-amber-400 drop-shadow-glow">
            cake
          </span>
        </div>

        <h2 class="text-4xl font-black text-white mb-4 tracking-tighter leading-tight">
          Happy Birthday!
        </h2>
        
        <p class="text-white/80 text-lg font-medium max-w-[80%] mx-auto leading-relaxed">
          We're celebrating <span class="text-amber-400 font-bold">YOU</span> today! 
          May your year be filled with success and joy.
        </p>
      </div>

      <v-card-actions class="bg-[#13121b] pa-8 justify-center border-t border-white/5">
        <v-btn
          @click="visible = false"
          block
          height="54"
          color="primary"
          variant="flat"
          class="rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-500/20"
        >
          Thank You! 🎈
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const visible = ref(false);

const checkBirthday = async () => {
  try {
    const userId = sessionStorage.getItem('id');
    if (!userId) return;

    const res = await fetch(`/api/check-birthday?user_id=${userId}`);
    const data = await res.json();
    
    if (data.success && data.isBirthday) {
      // Check if we've already shown it today to avoid annoying the user
      const today = new Date().toISOString().split('T')[0];
      const lastShown = localStorage.getItem(`birthday_shown_${userId}`);
      
      if (lastShown !== today) {
        visible.value = true;
        localStorage.setItem(`birthday_shown_${userId}`, today);
      }
    }
  } catch (err) {
    console.error('Error checking birthday:', err);
  }
};

onMounted(() => {
  checkBirthday();
});
</script>

<style scoped>
.birthday-modal {
  backdrop-filter: blur(20px);
}

.celebration-card {
  background: #13121b;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 3rem !important;
}

.festive-header {
  background: radial-gradient(circle at top right, #4338ca, #13121b 70%);
  min-height: 350px;
}

.drop-shadow-glow {
  filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.5));
}

.animate-bounce-gentle {
  animation: bounce-gentle 2s infinite ease-in-out;
}

@keyframes bounce-gentle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

.confetti-container {
  background-image: radial-gradient(#fbbf24 1px, transparent 1px),
                    radial-gradient(#c3c0ff 1px, transparent 1px);
  background-size: 40px 40px;
  background-position: 0 0, 20px 20px;
  opacity: 0.1;
}

/* Glassmorphism effect for the button */
.v-btn {
  background: linear-gradient(135deg, #4338ca, #6366f1) !important;
}
</style>
