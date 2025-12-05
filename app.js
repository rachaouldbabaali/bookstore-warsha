// import the express module
import express from "express";
// create app instance of express
const app = express();

// middleware to parse JSON request bodies
app.use(express.json());

// loging middleware
app.use((req, res, next) => {
  console.log(` request from loggin middleware ${req.method} ${req.url}`);
  next();
});



// routes for books
//    GET /books - get all books
app.get("/books", (req, res) => {
  res.json(books);
});
//   GET /books/:id - get a book by id
app.get("/books/:id", (req, res, next) => {
    try {
  const bookId = parseInt(req.params.id);
  const book = books.find((b) => b.id === bookId);
  if (book) {
    res.json(book);
  } else {   // book not found
    // res.status(404).json({ message: "Book not found" });
    const err = new Error("Book not found");
    err.status = 404; // not found
    err.message = "The book you are looking for does not exist.";
    throw err; // synchronous error handling
  }
    } catch (err) {
        next(err); // asynchronous error handling
    }
});
//    POST /books - add a new book
app.post("/books", (req, res) => {
  const newBook = {
    id: books.length + 1,
    title: req.body.title,
    author: req.body.author,
  };

  if (!newBook.title || !newBook.author) {
    // return res.status(400).json({ message: "Title and author are required" });
    const err = new Error();
    err.name = "ValidationError";
    throw err;
}
    if (typeof newBook.title !== "string" ) {
        const err = new Error();
        err.name = "TypeError";
        throw err;
    }
  books.push(newBook);
  res.status(201).json(newBook);
});
//   PUT /books/:id - update a book by id
// DELETE /books/:id - delete a book by id


// 404 route not found middleware
app.use((req, res, next) => {
    const error = new Error("Route not found");
    error.status = 404;
    next(error);
});

// error handling middleware  " global error handler middleware "
app.use((err, req, res, next) => {
    if (err.name === "ValidationError") {
        err.status = 400; // bad request
        err.message = "Invalid data format. check your input.";
    }

    if (err.name === "TypeError") {
        err.status = 400; // bad request
        err.message = "Type error occurred. check your input.";
    }
    console.log("Error handling middleware:", err.message);
    res.status(err.status || 500).json({ 
        success: false, 
        message: err.message || "Internal Server Error" 
    });
});

// start the server on port 3000

let books = [
  { id: 1, title: "1984", author: "George Orwell" },
  { id: 2, title: "To Kill a Mockingbird", author: "Harper Lee" },
];

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
