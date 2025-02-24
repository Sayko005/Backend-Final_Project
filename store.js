// src/store.js
import { ref } from 'vue';

export const token = ref(localStorage.getItem('token') || '');
export const user = ref(localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null);

export function setAuthData(newToken, newUser) {
  token.value = newToken;
  user.value = newUser;
  localStorage.setItem('token', newToken);
  localStorage.setItem('user', JSON.stringify(newUser));
}

export function clearAuthData() {
  token.value = '';
  user.value = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}
