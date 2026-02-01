require('./config');
const express = require('express');
const mongoose = require('mongoose');
const contentRouter = require('./routes/content');
const app = express();
const port = 3000;
const HOST = process.env.HOST || 'localhost';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/clips';

// middleware
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
})



mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));


app.use('/content', contentRouter)

app.get('/', (req, res) => {
  res.send('Content App');
})

app.listen(port, () => {
  console.log(`Server running at http://${HOST}:${port}`);
})