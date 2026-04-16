// server/server.js
const express = require('express');
const cors = require('cors');
const { dbConnect } = require('./config/db');  // DB connection
const authRoutes = require('./routes/authRoutes'); // Auth routes
const userRoutes = require('./routes/userRoutes'); // User routes

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
dbConnect();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Root route
app.get('/', (req, res) => {
    res.json("Server is running and healthy");
});

// Start Server
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));