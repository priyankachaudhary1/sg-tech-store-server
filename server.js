// Required imports
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');

// Middelwares
const app = express();
app.use(express.json());
app.use(morgan('dev'));
app.use(cors());
app.use('/api/auth', authRoutes);


// Conntection to the Database
async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Database connected successfully!');
  } catch (error) {
    console.error('Error connecting to database:', error.message);
  }
}

connectToDatabase();

// Routes
app.get('/healthcheck', (req, res) => {
    res.status(200).json({ message: 'Server is up and running' });
  });




// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server listening on port ${process.env.PORT}`);
});