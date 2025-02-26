# Gamified Library

A full-stack application for a gamified library system built with Node.js, Express, SQLite, JWT, and Vue 3.

## Overview

Gamified Library allows users to register, log in, and interact with a library of books. Users can upload books (in PDF format), track their reading progress, and earn XP to level up. Admin users have additional permissions, such as approving or deleting uploaded books.

The project includes:
- **Backend**: Node.js with Express, using SQLite as the database, JWT for authentication, and bcrypt for password hashing.
- **Frontend**: A Vue 3 application with Vue Router and Axios for API communication.
- The backend also serves the static Vue build from the `client-dist` folder.

## Features

- **User Registration & Authentication**: Secure sign-up and login using JWT and password hashing.
- **Gamification**: Earn XP for uploading and finishing books. User level is calculated based on XP.
- **Book Upload & Approval**: Users can upload books in PDF format; admin users can approve or delete books.
- **Reading Progress Tracking**: Users can read books and track their current page.
- **Responsive UI**: A modern, blue–cyan themed interface built with Vue 3.

## Technologies Used

- **Backend**: Node.js, Express, SQLite, bcrypt (or bcryptjs), JSON Web Tokens (JWT), Multer.
- **Frontend**: Vue 3, Vue Router, Axios.
- **Deployment**: Designed to run on [Replit](https://replit.com/) (free tier) with persistent SQLite database.

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v12 or higher)
- [npm](https://www.npmjs.com/)

### Steps to Run Locally

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Sayko005/Backend-Final_Project.git
   cd gamified-library
