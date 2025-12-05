
// Model level mongoose functions

// Model.find(): Retrieves all documents that match the query criteria.
// Example:
// const books = await Book.find({ author: "John Doe" });

// Model.findById(): Retrieves a single document by its unique identifier (_id).
// Example:
// const book = await Book.findById("60c72b2f9b1d4c3a5c8e4d3e");

// Model.findOne(): Retrieves the first document that matches the query criteria.
// Example:
// const book = await Book.findOne({ title: "Mongoose Basics" });

// Model.create(): Creates a new document and saves it to the database.
// Example:
// const newBook = await Book.create({ title: "New Book", author: "Jane Doe" });

// Model.findByIdAndUpdate(): Updates a document by its unique identifier and returns the updated document.
// Example:
// const updatedBook = await Book.findByIdAndUpdate("60c72b2f9b1d4c3a5c8e4d3e", { title: "Updated Title" }, { new: true });

// Model.findByIdAndDelete(): Deletes a document by its unique identifier.
// Example:
// const deletedBook = await Book.findByIdAndDelete("60c72b2f9b1d4c3a5c8e4d3e");

// Model.countDocuments(): Counts the number of documents that match the query criteria.
// Example:
// const count = await Book.countDocuments({ author: "John Doe" });

// Model.findOneAndUpdate(): Finds a single document by criteria and updates it.
// Example:
// const updatedBook = await Book.findOneAndUpdate({ title: "Old Title" }, { title: "New Title" }, { new: true });



//Document level mongoose functions

// document.save(): Saves the current document to the database.
// Example:
// const book = new Book({ title: "New Book", author: "Jane Doe" });
// await book.save();

// document.remove(): Removes the current document from the database.
// Example:
// const book = await Book.findById("60c72b2f9b1d4c3a5c8e4d3e");
// await book.remove();

// document.validate(): Validates the current document against the schema.
// Example:
// const book = new Book({ title: "", author: "Jane Doe" });
// await book.validate();

// document.toObject(): Converts the Mongoose document into a plain JavaScript object.
// Example:
// const book = await Book.findById("60c72b2f9b1d4c3a5c8e4d3e");
// const plainObject = book.toObject();

// document.toJSON(): Converts the Mongoose document into a JSON object.
// Example:
// const book = await Book.findById("60c72b2f9b1d4c3a5c8e4d3e");
// const jsonObject = book.toJSON();