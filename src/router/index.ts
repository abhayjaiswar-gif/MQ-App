import { createRouter, createWebHistory } from 'vue-router';
import MainRoutes from './MainRoutes';
import PublicRoutes from './PublicRoutes';
import { useAuthStore } from '@/stores/auth';
import { useUIStore } from '@/stores/ui';

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:pathMatch(.*)*',
      component: () => import('@/views/pages/maintenance/error/Error404Page.vue')
    },
    MainRoutes,
    PublicRoutes
  ]
});

interface User {
  // Define the properties and their types for the user data here
  // For example:
  id: number;
  name: string;
}

// Assuming you have a type/interface for your authentication store
interface AuthStore {
  user: User | null;
  returnUrl: string | null;
  login(username: string, password: string): Promise<void>;
  logout(): void;
}

router.beforeEach(async (to, from, next) => {
  const sessionId = sessionStorage.getItem('id') || localStorage.getItem('id');
  // const sessionId = 2;
  const auth: AuthStore = useAuthStore();
  const authRequired = to.matched.some((record) => record.meta.requiresAuth);
  if (authRequired && !sessionId) {
    auth.returnUrl = to.fullPath;
    next('/login1');
  } else if (sessionId && (to.path === '/login' || to.path === '/login1' || to.path === '/')) {
    next({
      path: auth.returnUrl && auth.returnUrl !== '/' ? auth.returnUrl : '/dashboard'
    });
  } else {
    next();
  }
});
router.beforeEach(() => {
  const uiStore = useUIStore();
  uiStore.isLoading = true;
});
router.afterEach(() => {
  const uiStore = useUIStore();
  uiStore.isLoading = false;
});
