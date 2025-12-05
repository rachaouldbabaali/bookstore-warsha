const errorMiddleware = (err, req, res, next) => {
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
    message: err.message || "Internal Server Error",
  });
};

export default errorMiddleware;