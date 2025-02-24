<template>
  <div>
    <h2>Sign Up</h2>
    <form @submit.prevent="handleSignup">
      <div>
        <label>Username:</label>
        <input v-model="username" />
      </div>
      <div>
        <label>Password:</label>
        <input type="password" v-model="password" />
      </div>
      <button type="submit">Sign Up</button>
    </form>
    <p v-if="errorMessage" style="color:red">{{ errorMessage }}</p>
  </div>
</template>

<script>
import axios from '@/axios';

export default {
  name: 'SignupView',
  data() {
    return {
      username: '',
      password: '',
      errorMessage: ''
    };
  },
  methods: {
    async handleSignup() {
      try {
        const response = await axios.post('/auth/signup', {
          username: this.username,
          password: this.password
        });
        alert(response.data.message);
        this.$router.push('/login');
      } catch (error) {
        this.errorMessage = error.response?.data?.error || 'Sign-up error';
      }
    }
  }
};
</script>
