import { Book } from "../models/book.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/uploadOnCloudinary.js";
import http from'http';
import https from 'https';
import { pipeline } from "stream";
import fs from 'fs';


const uploadBook = async (req, res) => {
  try {
    if (!req.file) {
      console.log("No file received by multer"); 
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


/*export const searchBooks = async (req, res) => {
  const { genre, author, bookName } = req.query;

  const trimmedGenre = genre?.trim();
  const trimmedAuthor = author?.trim();
  const trimmedBookName = bookName?.trim();


  if ([trimmedGenre, trimmedAuthor, trimmedBookName].every(val => !val)) {
    throw new ApiError(400, "At least one search field is required");
  }

  if ([trimmedGenre, trimmedAuthor, trimmedBookName].some(val => val?.length > 100)) {
    throw new ApiError(400, "Search fields must be under 100 characters");
  }

  const filter = {};

  if (trimmedGenre) {
    filter.genre = trimmedGenre.toLowerCase();
  }

  if (trimmedAuthor) {
    filter.author = new RegExp(trimmedAuthor, "i");
  }

  if (trimmedBookName) {
    filter.bookName = new RegExp(trimmedBookName, "i");
  }

  const books = await Book.find(filter).sort({ createdAt: -1 });

  if (books.length === 0) {
    throw new ApiError(404, "No books found matching the criteria");
  }

  return res.status(200).json(
    new ApiResponse(200, books, "Books fetched based on search criteria")
  );
};
*/

const searchBooks = async (req, res) => {

  try {

    const { genre, author, bookName, page = 1, limit = 10 } = req.query;

    const trimmedGenre = genre?.trim();
    const trimmedAuthor = author?.trim();
    const trimmedBookName = bookName?.trim();

    const inputTooLong = [trimmedAuthor, trimmedBookName, trimmedGenre].some(
      (field) => field.length > 100
    );

    if (inputTooLong) {
      throw new ApiError(400, "Search fields must be under 100 characters");
    }

    const safePage = Math.max(1, parseInt(page));
    const safeLimit = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (safePage - 1) * safeLimit;

    if (![trimmedAuthor, trimmedBookName, trimmedGenre].some((val) => val)) {

      throw new ApiError(400, "Atleast one search field is required");

    }

    const filter = {};

    if (trimmedGenre) {
      filter.genre = trimmedGenre.toLowerCase();
    }

    if (trimmedAuthor) {
      const safeAuthor = trimmedAuthor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.author = new RegExp(safeAuthor, "i");
    }

    if (trimmedBookName) {

      const safeBookName = trimmedBookName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.bookName = new RegExp(safeBookName, "i");

    }

    const [books, total] = await Promise.all([

      Book.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .select("bookName content"),

      Book.countDocuments(filter),

    ]);

    const previews = books.map((book) => (
      {
        title: book.bookName,
        previewUrl: book.content,
      }
    ));

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          {
            total,
            page: safePage,
            totalPages: Math.ceil(total / safeLimit),
            previews,
          },
          "Books fetched successfully while search"
        )
      );


  } catch (error) {

    throw new ApiError(500 , error.message || "Search failed");

  }

}

const downloadBook = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Book ID is required");
    }

    const book = await Book.findById(id).select("content bookName");

    if (!book) {
      throw new ApiError(404, "Book not found!");
    }

    const fileUrl = book.content;
    const fileName = `${book.bookName || "book"}.pdf`;

    // Choose http or https depending on URL
    const client = fileUrl.startsWith("https") ? https : http;

    client.get(fileUrl, (fileRes) => {
      if (fileRes.statusCode !== 200) {
        return res.status(404).json({ message: "File not accessible" });
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

      pipeline(fileRes, res, (err) => {
        if (err) {
          console.error("Pipeline error:", err);
          res.status(500).end("Error streaming file");
        }
      });
    }).on("error", (err) => {
      console.error("Fetch error:", err);
      res.status(500).json({ message: "Error fetching file" });
    });

  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ message: "Error while downloading the book" });
  }
};

const previewBook = async (req, res) => {

  try{

      const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Book id id required");
  }

  const book = await Book.findById(id).select("content");

  if (!book) {
    throw new ApiError(404, "Book not found!");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { previewUrl: book.content },
        "Preview link generated")
    );

  }catch(error){

    console.error("Error while preview : ", error);
    throw new ApiError(500 , "Error while generating preview");

  }



};


 const paginateBooks = async (req, res) => {

  const rawPage = req.query.page;
  const rawLimit = req.query.limit;


  const page = Math.max(1, parseInt(rawPage) || 1);

  const limit = Math.min(100, Math.max(1, parseInt(rawLimit) || 10));
  const skip = (page - 1) * limit;

  try {
    const [books, total] = await Promise.all([
      Book.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Book.countDocuments()
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          total,
          page,
          totalPages: Math.ceil(total / limit),
          books
        },
        "Paginated books fetched successfully"
      )
    );
  } catch (error) {
    throw new ApiError(500, "Something went wrong while paginating books");
  }
};



export {
  uploadBook,
  updateBook,
  deleteBook,
  getAllBooks,
  searchBooks,
  downloadBook,
  previewBook,
  paginateBooks
}

