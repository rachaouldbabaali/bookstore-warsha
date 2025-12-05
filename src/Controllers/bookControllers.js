import Book from '../Models/Book.js';

const getAllBooks = async (req, res, next) => {
  try {
    const books = await Book.find(); // fetch all books from MongoDB
    res.json(books);
  } catch (err) {
    next(err); // asynchronous error handling
  }
};
export { getAllBooks };