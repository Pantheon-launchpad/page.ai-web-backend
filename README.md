# Backend API

## Overview

This is the backend API for the project. It is built with Node.js and Express.js and provides the server-side functionality, API routes, database connection, and backend logic.

## Tech Stack

- Node.js
- Express.js
- Dotenv
- Helmet
- Morgan
- CORS
- Nodemon
- Chalk

## Installation

Clone the repository:

```bash
git clone https://github.com/Pantheon-launchpad/page.ai-web-backend.git
```

Navigate into the backend folder:

```bash
cd page.ai-web-backend
```

Install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Do not commit the `.env` file to GitHub.

## Running the Project

Start the server:

```bash
npm start
```

For development with automatic restarting:

```bash
npm run dev
```

The server will run on:

```
http://localhost:5000
```

## API Health Check

### GET /

Checks if the API is running.

Response:

```json
{
  "success": true,
  "message": "API is running"
}
```

## Middleware Used

### Helmet
Adds security headers to protect the API.

### Morgan
Logs HTTP requests during development.

### CORS
Allows communication between the frontend and backend.

### Express JSON
Allows the server to receive JSON data.
