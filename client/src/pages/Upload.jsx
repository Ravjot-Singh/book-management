import React, { useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const Upload = () => {

    const [formData, setFormData] = useState({

        author: "",
        bookName: "",
        genre: "",
    });

    const [file, setFile] = useState(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));

    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!file) {
            return setError("Please select a file to upload");
        }

        try {

            const data = new FormData();
            data.append('file', file);
            data.append("author", formData.author);
            data.append("bookName", formData.bookName);
            data.append("genre", formData.genre);

            const res = await axios.post("http://localhost:7000/api/users/upload", data, {
                withCredentials: true,
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            setSuccess(res.data?.message || "Book uploaded!");
            setTimeout(() => navigate("/"), 1000);


        } catch (error) {

            setError(error.response?.data?.message || "Upload failed");

        }

    };


    return (

        <div className="upload-form">
            <h2>Upload a new book</h2>

            <form onSubmit={handleSubmit}>

                <input type="text" name="author" placeholder="Author name" value={formData.author} onChange={handleChange} required />
                <input type="text" name="bookName" placeholder="book title" value={formData.bookName} onChange={handleChange} required />
                <input type="text" name="genre" placeholder="genre" value={formData.genre} onChange={handleChange} required />
                <input type="file" accept="application/pdf" onChange={handleFileChange} required />

                <button type="submit">Upload</button>
            </form>

            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}

        </div>

    );

};

export default Upload;