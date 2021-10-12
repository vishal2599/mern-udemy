import express from 'express';
import connectDB from './config/db.js';

import apiUsers from './routes/api/users.js';
import apiProfile from './routes/api/profile.js';
import apiAuth from './routes/api/auth.js';
import apiPosts from './routes/api/posts.js';
const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('API running'));

// Define Routes

app.use('/api/users', apiUsers);
app.use('/api/auth', apiAuth);
app.use('/api/profile', apiProfile);
app.use('/api/posts', apiPosts);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));