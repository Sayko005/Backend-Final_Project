<template>
  <div>
    <h2>Approved Books</h2>
    <button @click="fetchBooks">Refresh</button>
    <ul>
      <li v-for="book in books" :key="book.id">
        "{{ book.title }}" — {{ book.author }}
        (Difficulty: {{ book.difficulty_level }})

        <!-- Show current progress if we have it -->
        <span v-if="progressMap[book.id]">
          — Stopped at page {{ progressMap[book.id] }}
        </span>

        <button @click="goRead(book.id)">Read</button>
      </li>
    </ul>
    <p v-if="errorMessage" style="color:red">{{ errorMessage }}</p>
  </div>
</template>

<script>
import axios from '@/axios';

export default {
  name: 'BooksView',
  data() {
    return {
      books: [],
      errorMessage: '',
      progressMap: {} // bookId -> currentPage
    };
  },
  async mounted() {
    await this.fetchBooks();
  },
  methods: {
    async fetchBooks() {
      try {
        const res = await axios.get('/books');
        this.books = res.data;
        // For each book, fetch the user's progress
        for (let book of this.books) {
          await this.fetchProgress(book.id);
        }
      } catch (error) {
        this.errorMessage = 'Error loading book list';
      }
    },
    async fetchProgress(bookId) {
      try {
        const res = await axios.get(`/books/${bookId}/progress`);
        this.progressMap[bookId] = res.data.current_page;
      } catch (error) {
        // If there's no progress or an error, we do nothing
      }
    },
    goRead(bookId) {
      this.$router.push({ name: 'read', params: { bookId } });
    }
  }
};
</script>
