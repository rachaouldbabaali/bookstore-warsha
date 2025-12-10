// Import the express module
import express from "express";
// Import pg (PostgreSQL client) - Changed from mongoose
import pkg from "pg";
const { Pool } = pkg;
// Note: We removed the mongoose import since we're switching to PostgreSQL

// create app instance of express
const app = express();

// ==================== POSTGRESQL SETUP ====================
// Create PostgreSQL connection pool instead of MongoDB connection
// A connection pool manages multiple database connections for better performance
const pool = new Pool({
  user: "postgres",         // PostgreSQL username (default is 'postgres')
  host: "localhost",        // Database server address
  database: "bookstore",    // Database name
  password: "0130",     // PostgreSQL password (default is 'postgres' or empty)
  port: 5432,               // PostgreSQL default port
  // Connection pool settings:
  max: 20,                  // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client can remain idle before being closed
  connectionTimeoutMillis: 2000, // Connection timeout
});

// Test PostgreSQL connection
pool.connect((err, client, release) => {
  if (err) {
    console.error("Error connecting to PostgreSQL:", err.message);
  } else {
    console.log("✅ Connected to PostgreSQL database");
    release(); // Release the client back to the pool
  }
});

// ==================== DATABASE INITIALIZATION ====================
// Since PostgreSQL needs tables created, we'll set up the database schema
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Create books table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,                -- Auto-incrementing integer ID
        title VARCHAR(255) NOT NULL,          -- Book title (required)
        author VARCHAR(255) NOT NULL,         -- Author name (required)
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP  -- Auto timestamp
      )
    `);
    console.log("✅ Books table ready");
    
    // Check if we need to seed initial data
    const result = await client.query("SELECT COUNT(*) FROM books");
    if (parseInt(result.rows[0].count) === 0) {
      // Insert initial data
      await client.query(`
        INSERT INTO books (title, author) 
        VALUES 
          ('1984', 'George Orwell'),
          ('To Kill a Mockingbird', 'Harper Lee')
      `);
      console.log("✅ Initial books inserted");
    }
  } catch (err) {
    console.error("Error initializing database:", err.message);
  } finally {
    client.release(); // Always release the client back to the pool
  }
}

// Initialize database when server starts
initializeDatabase();

// ==================== MIDDLEWARE ====================
// Middleware to parse JSON request bodies
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

// ==================== ROUTES ====================
// GET /books - Get all books
app.get("/books", async (req, res, next) => {
  try {
    // Changed from Book.find() to SQL query
    const result = await pool.query("SELECT * FROM books ORDER BY id");
    res.json(result.rows); // PostgreSQL returns data in result.rows
  } catch (err) {
    next(err);
  }
});

// GET /books/:id - Get a book by id
app.get("/books/:id", async (req, res, next) => {
  try {
    console.log("Fetching book with id:", req.params.id);
    
    // PostgreSQL uses parameterized queries to prevent SQL injection
    // $1 is the first parameter (req.params.id)
    const result = await pool.query("SELECT * FROM books WHERE id = $1", [req.params.id]);
    
    if (result.rows.length === 0) {
      // Book not found
      const err = new Error("Book not found");
      err.status = 404;
      err.message = "The book you are looking for does not exist.";
      throw err;
    }
    
    res.json(result.rows[0]); // Return first (and should be only) row
  } catch (err) {
    console.log("Error fetching book:", err.message);
    next(err);
  }
});

// POST /books - Add a new book
app.post("/books", async (req, res, next) => {
  try {
    const { title, author } = req.body;
    
    // Validation
    if (!title || !author) {
      const err = new Error("Title and author are required");
      err.status = 400;
      throw err;
    }
    
    if (typeof title !== "string" || typeof author !== "string") {
      const err = new Error("Invalid data type");
      err.status = 400;
      throw err;
    }
    
    // Changed from Book.create() to SQL INSERT query
    // RETURNING * returns the inserted row
    const result = await pool.query(
      "INSERT INTO books (title, author) VALUES ($1, $2) RETURNING *",
      [title, author]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /books/:id - Update a book by id
app.put("/books/:id", async (req, res, next) => {
  try {
    const { title, author } = req.body;
    const bookId = req.params.id;
    
    // Validate input
    if (!title && !author) {
      const err = new Error("At least one field (title or author) must be provided");
      err.status = 400;
      throw err;
    }
    
    // Build dynamic update query based on provided fields
    let query = "UPDATE books SET ";
    const values = [];
    let paramCount = 1;
    
    if (title) {
      query += `title = $${paramCount}`;
      values.push(title);
      paramCount++;
    }
    
    if (author) {
      if (title) query += ", ";
      query += `author = $${paramCount}`;
      values.push(author);
      paramCount++;
    }
    
    query += ` WHERE id = $${paramCount} RETURNING *`;
    values.push(bookId);
    
    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      const err = new Error("Book not found");
      err.status = 404;
      throw err;
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /books/:id - Delete a book by id
app.delete("/books/:id", async (req, res, next) => {
  try {
    const result = await pool.query(
      "DELETE FROM books WHERE id = $1 RETURNING *",
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      const err = new Error("Book not found");
      err.status = 404;
      throw err;
    }
    
    res.json({
      message: "Book deleted successfully",
      book: result.rows[0]
    });
  } catch (err) {
    next(err);
  }
});

// Search endpoint: /search?title=1984&author=Orwell
app.get("/search", async (req, res, next) => {
  try {
    const { title, author } = req.query;
    
    // If both title and author are provided, search with AND condition
    if (title && author) {
      const result = await pool.query(
        "SELECT * FROM books WHERE title ILIKE $1 AND author ILIKE $2",
        [`%${title}%`, `%${author}%`]
      );
      res.json(result.rows);
    } 
    // If only title is provided
    else if (title) {
      const result = await pool.query(
        "SELECT * FROM books WHERE title ILIKE $1",
        [`%${title}%`]
      );
      res.json(result.rows);
    }
    // If only author is provided
    else if (author) {
      const result = await pool.query(
        "SELECT * FROM books WHERE author ILIKE $1",
        [`%${author}%`]
      );
      res.json(result.rows);
    }
    // If no search parameters provided
    else {
      const result = await pool.query("SELECT * FROM books");
      res.json(result.rows);
    }
  } catch (err) {
    next(err);
  }
});

// Search by title OR author: /searchbyAuthorOrtitle?title=1984&author=Orwell
app.get("/searchbyAuthorOrtitle", async (req, res, next) => {
  try {
    const { title, author } = req.query;
    
    // Build query dynamically based on provided parameters
    let query = "SELECT * FROM books WHERE ";
    const conditions = [];
    const values = [];
    let paramCount = 1;
    
    if (title) {
      conditions.push(`title ILIKE $${paramCount}`);
      values.push(`%${title}%`);
      paramCount++;
    }
    
    if (author) {
      conditions.push(`author ILIKE $${paramCount}`);
      values.push(`%${author}%`);
      paramCount++;
    }
    
    // If no search parameters provided, return all books
    if (conditions.length === 0) {
      const result = await pool.query("SELECT * FROM books");
      return res.json(result.rows);
    }
    
    // Join conditions with OR
    query += conditions.join(" OR ");
    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// ==================== NEW FEATURES ADDED ====================
// GET /stats - Get book statistics
app.get("/stats", async (req, res, next) => {
  try {
    // Get various statistics in one query
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_books,
        COUNT(DISTINCT author) as unique_authors,
        STRING_AGG(DISTINCT author, ', ') as all_authors
      FROM books
    `);
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// GET /books/author/:authorName - Get all books by a specific author
app.get("/books/author/:authorName", async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT * FROM books WHERE author ILIKE $1 ORDER BY title",
      [`%${req.params.authorName}%`]
    );
    res.json({
      author: req.params.authorName,
      count: result.rowCount,
      books: result.rows
    });
  } catch (err) {
    next(err);
  }
});

// ==================== ERROR HANDLING MIDDLEWARE ====================
// 404 route not found middleware
app.use((req, res, next) => {
  const error = new Error("Route not found");
  error.status = 404;
  next(error);
});

// Global error handler middleware
app.use((err, req, res, next) => {
  // Handle specific PostgreSQL errors
  if (err.code === '23505') { // Unique constraint violation
    err.status = 409; // Conflict
    err.message = "A book with that title already exists";
  } else if (err.code === '23502') { // Not null violation
    err.status = 400;
    err.message = "Required field is missing";
  } else if (err.code === '22P02') { // Invalid input syntax
    err.status = 400;
    err.message = "Invalid ID format";
  }
  
  // Handle our custom validation errors
  if (err.name === "ValidationError" || err.message === "Title and author are required") {
    err.status = 400;
    err.message = "Invalid data format. Check your input.";
  }
  
  if (err.name === "TypeError" || err.message === "Invalid data type") {
    err.status = 400;
    err.message = "Type error occurred. Check your input.";
  }
  
  console.log("Error handling middleware:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    // In development, you might want to include stack trace:
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ==================== SERVER STARTUP ====================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📚 Bookstore API with PostgreSQL is ready!`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET    /books                    - Get all books`);
  console.log(`  GET    /books/:id               - Get book by ID`);
  console.log(`  POST   /books                    - Add new book`);
  console.log(`  PUT    /books/:id               - Update book`);
  console.log(`  DELETE /books/:id               - Delete book`);
  console.log(`  GET    /search                  - Search books (AND)`);
  console.log(`  GET    /searchbyAuthorOrtitle   - Search books (OR)`);
  console.log(`  GET    /stats                   - Get statistics`);
  console.log(`  GET    /books/author/:author    - Get books by author`);
});

// Export the app for testing
export default app;