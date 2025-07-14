import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Home = () => {


  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading , setLoading] = useState(false);
  const [error , setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchBooks = async (pageNumber) => {

    setLoading(true);
    setError('');

    try {

      const res = await axios.get(`http://localhost:7000/api/users/paginate?page=${pageNumber}&limit=5`);

      const {books , totalPages} = res.data.data;

      setBooks(books);
      setTotalPages(totalPages);

    } catch (error) {

      console.error("Failed to fetch books : ", error);

    }finally{
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks(page);
  }, [page]);



  const handlePreview = async(bookId) => {
    try{

      const res = await axios.get(`http"//localhost:7000/api/users/preview/${bookId}`);

      const {previewUrl} = res.data.data;

      window.open(previewUrl , '_blank');

    }catch(error){

      alert("Failed to load preview. Please try again");
      console.log("Failed to load preview. Try again shortly!");

    }
  };


const handleDownload = async (bookId) => {
  if (!user) {
    alert("Log-in to download books");
    return;
  }

  try {
    const res = await axios.get(`http://localhost:7000/api/users/download/${bookId}`, {
      responseType: "blob",
      withCredentials: true,
    });

    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `book-${bookId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

  } catch (error) {
    alert("Failed to download book.");
    console.error(error);
  }
};


  if(loading && books.length === 0){
    return <div className="Loading">Loading books...</div>
  }


  return (
    <div className="home-page">
      <h2>Welcome to the Book Portal</h2>
      <p>Search, preview, and download books!</p>

      <div className="book-list">
        {books.map((book) => (
          <div key={book._id} className="book-card">
            <h3>{book.title}</h3>
            <p>Author: {book.author}</p>
            <button onClick={() => handlePreview(book._id)}>Preview</button>
            <button onClick={() => handleDownload(book._id)}>Download</button>
          </div>
        ))}
      </div>

      <div className="pagination">
        <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </div>
  );
};

export default Home;
