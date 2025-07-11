import { Book } from "../models/book.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/uploadOnCloudinary.js";
import fs from 'fs';


 const uploadBook = async (req, res) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "No file uploaded!");
    }

    const { author, bookName, genre } = req.body;
    const bookLocalPath = req.file.path;

    if ([author, bookName, genre].some((field) => !field?.trim())) {
      fs.unlinkSync(bookLocalPath);
      throw new ApiError(400, "All fields are required!");
    }

    const result = await uploadOnCloudinary(bookLocalPath);

    if (!result?.url) {
      fs.unlinkSync(bookLocalPath);
      throw new ApiError(500, "Cloud upload failed");
    }

    const book = await Book.create({
      author,
      bookName,
      genre,
      content: result.url,
      uploader: req.user._id,
    });


    fs.unlinkSync(bookLocalPath);

    return res
      .status(201)
      .json(new ApiResponse(201, book, "Book uploaded successfully!"));
  } catch (error) {

    if (req?.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    throw error;
  }
};

const updateBook = async (req, res) => {

    const { id } = req.params;
    const { author, bookName, genre } = req.body;

    const book = await Book.findById(id);

    if (!book) {
        throw new ApiError(404, "Book not found");
    }

    if (String(book.uploader) !== String(req.user._id)) {
        throw new ApiError(403, "You are not authorized to update the book");
    }

    if (req.file) {
        const result = await uploadOnCloudinary(req.file.path);
        if (!result?.url) {
            throw new ApiError(500, "Cloud upload failed");
        }
        book.content = result.url;
        fs.unlinkSync(req.file.path);
    }

    if (author) book.author = author;
    if (bookName) book.bookName = bookName;
    if (genre) book.genre = genre;

    await book.save();

    return res.status(200).json(new ApiResponse(200, book, "Book updated successfully"));


}


const deleteBook = async (req, res) => {
    const { id } = req.params;

    const book = await Book.findById(id);
    if (!book) throw new ApiError(404, "Book not found");

    if (String(book.uploader) !== String(req.user._id)) {
        throw new ApiError(403, "You are not authorized to delete this book");
    }

    await Book.findByIdAndDelete(id);

    return res.status(200).json(new ApiResponse(200, {}, "Book deleted successfully"));
};



const getAllBooks = async (_req, res) => {
    const books = await Book.find().sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, books, "Books fetched successfully"));
};





export { uploadBook, updateBook, deleteBook, getAllBooks }

