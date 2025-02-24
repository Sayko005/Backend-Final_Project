<template>
  <div>
    <h2>Upload a Book</h2>
    <form @submit.prevent="uploadBook">
      <div>
        <label>Title:</label>
        <input v-model="title" />
      </div>
      <div>
        <label>Author:</label>
        <input v-model="author" />
      </div>
      <div>
        <label>Difficulty:</label>
        <input type="number" v-model.number="difficulty_level" />
      </div>
      <div>
        <label>PDF File:</label>
        <input type="file" @change="onFileChange" />
      </div>
      <div>
        <label>Total pages:</label>
        <input type="number" v-model.number="total_pages" />
      </div>
      <button type="submit">Upload</button>
    </form>
    <p v-if="errorMessage" style="color:red">{{ errorMessage }}</p>
    <p v-if="successMessage" style="color:green">{{ successMessage }}</p>
  </div>
</template>

<script>
import axios from '@/axios';

export default {
  name: 'UploadBookView',
  data() {
    return {
      title: '',
      author: '',
      difficulty_level: 1,
      file: null,
      total_pages: null,
      errorMessage: '',
      successMessage: ''
    };
  },
  methods: {
    onFileChange(e) {
      this.file = e.target.files[0];
    },
    async uploadBook() {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user) {
          this.errorMessage = 'Please log in first.';
          return;
        }
        const formData = new FormData();
        formData.append('title', this.title);
        formData.append('author', this.author);
        formData.append('difficulty_level', this.difficulty_level);
        formData.append('added_by', user.id);
        formData.append('pdfFile', this.file);
        formData.append('total_pages', this.total_pages);

        const res = await axios.post('/books/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        this.successMessage = res.data.message;

        // Clear fields
        this.title = '';
        this.author = '';
        this.difficulty_level = 1;
        this.file = null;
        this.total_pages = null;
      } catch (error) {
        this.errorMessage = error.response?.data?.error || 'Error uploading the book';
      }
    }
  }
};
</script>
