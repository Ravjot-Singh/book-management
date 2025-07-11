import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
    {
        author: {
            type: String,
            required: true,
            trim: true
        },
        bookName: {
            type: String,
            required: true,
            trim: true
        },
        genre: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        content: {
            type: String,
            required: true
        },
        uploader: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }


    },
    { timestamps: true }

);

export const Book = mongoose.model("Book", bookSchema);