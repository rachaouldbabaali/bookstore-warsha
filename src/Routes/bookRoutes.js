import express from 'express';
import Book from '../Models/Book.js';
import { getAllBooks } from '../controllers/bookControllers.js';

const router = express.Router();

//    GET /books - get all books
router.get("/", getAllBooks);
//   GET /books/:id - get a book by id
router.get("/:id", async (req, res, next) => {
  try {
    console.log("Fetching book with id:", req.params.id);
    const bookId = req.params.id;
    console.log("Converted book id to string:", typeof bookId, bookId);
    const book = await Book.findById(bookId); // fetch book by id from MongoDB
    if (!book) {
        console.log("Book not found with id:", req.params.id);
      // book not found
      // res.status(404).json({ message: "Book not found" });
      const err = new Error("Book not found");
      err.status = 404; // not found
      err.message = "The book you are looking for does not exist.";
      throw err; // synchronous error handling
    }
    res.json(book);
  } catch (err) {
    console.log("Error fetching book:", err.message);
    next(err); // asynchronous error handling
  }
});
//    POST /books - add a new book
router.post("/", async (req, res, next) => {
    try {
  const newBook = await Book.create(req.body); 

  if (!newBook.title || !newBook.author) {
    // return res.status(400).json({ message: "Title and author are required" });
    const err = new Error();
    err.name = "ValidationError";
    throw err;
  }
  if (typeof newBook.title !== "string") {
    const err = new Error();
    err.name = "TypeError";
    throw err;
  }
  res.status(201).json(newBook);
} catch (err) {
    next(err);  
}
});
//   PUT /books/:id - update a book by id
// DELETE /books/:id - delete a book by id

// Query search   ///search?title=1984&author=Orwell  or /search?title=1984  or /search?author=Orwell
router.get("/search", async (req, res, next) => {
    try {
        console.log("Search query title:", req.query);
        const {title, author} = req.query;
        
        const books = await Book.find({ title: new RegExp(title, 'i'),
            author: new RegExp(author, 'i')
         });
        res.json(books);
    
    } catch (err) {
      next(err);
    }
});


// Query search by title or author   ///searchbyAuthorOrtitle?title=1984  or /searchbyAuthorOrtitle?author=Orwell  or /searchbyAuthorOrtitle?title=1984&author=Orwell
router.get("/searchbyAuthorOrtitle", async (req, res, next) => {
    try {
        console.log("Search query title:", req.query);
        const {title, author} = req.query;
        
        const searchCondition = [];
        if (title) {
            searchCondition.push({ title: new RegExp(title, 'i') });
        }
        if (author) {
            searchCondition.push({ author: new RegExp(author, 'i') });
        }
        const books = await Book.find({ $or: searchCondition });
        res.json(books);
    
    } catch (err) {
      next(err);
    }
});

export default router;