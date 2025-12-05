import express from 'express';

// import routes 
import appRoutes from './Routes/index.js';
// import db 
import connectedDB from './config/database.js';
// import middlewares 
import errorMiddleware from './Middlewares/errorMiddleware.js';
connectedDB();

const app = express();
// middleware
app.use(express.json());

// loging middleware
app.use((req, res, next) => {
  console.log(` request from loggin middleware ${req.method} ${req.url}`);
  next();
});

// routes for books
//from routes/books.js

app.use('/', appRoutes);

// error handling middleware
app.use(errorMiddleware);

export default app;