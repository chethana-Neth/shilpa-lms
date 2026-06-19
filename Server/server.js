require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { dbConnect } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');
const quizRoutes = require('./routes/quizRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const adminRoutes = require('./routes/adminRoutes');
const progressRoutes = require('./routes/progressRoutes');

const app = express();

// Allow the frontend to talk to this server.
app.use(cors());
app.use(express.json());

dbConnect();

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/progress', progressRoutes);

app.use('/uploads', express.static('uploads'));
app.use('/api/password', passwordRoutes);
app.use('/api/admin', adminRoutes);


app.get('/', (req, res) => res.json("Server is running and healthy"));

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));