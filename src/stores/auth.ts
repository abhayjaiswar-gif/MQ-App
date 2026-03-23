import { defineStore } from 'pinia';
import { router } from '@/router';
import { fetchWrapper } from '@/utils/helpers/fetch-wrapper';

const baseUrl = `${import.meta.env.VITE_API_URL}/users`;

export const useAuthStore = defineStore({
  id: 'auth',
  state: () => ({
    // initialize state from local storage to enable user to stay logged in
    /* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    user: JSON.parse(localStorage.getItem('user')),
    returnUrl: null
  }),
  actions: {
    async login(username: string, password: string) {
      try {
        const response = await fetch('http://localhost:3000/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: username, password })
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
          throw data.message || 'Login failed';
        }

        // update pinia state to include token so fetchWrapper can use it
        this.user = { ...data.user, token: data.token };
        
        // store user details and jwt securely in storage to maintain logged-in state 
        localStorage.setItem('user', JSON.stringify(this.user));
        sessionStorage.setItem('id', data.user.id);
        localStorage.setItem('token', data.token);
        
        // redirect to previous url or default to home page
        router.push(this.returnUrl || '/dashboard');
      } catch (error) {
        throw error;
      }
    },
    logout() {
      this.user = null;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.removeItem('id');
      localStorage.removeItem('id');
      router.push('/login1');
    }
  }
});
