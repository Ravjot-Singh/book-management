import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const [books, setBooks] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchBooks = async (pageNumber) => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:7000/api/users/paginate?page=${pageNumber}&limit=5`);
      const { books, totalPages } = res.data.data;
      setBooks(books);
      setTotalPages(totalPages);
    } catch (error) {
      console.error("Failed to fetch books:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks(page);
  }, [page]);

  const handlePreview = async (bookId) => {
    try {
      const res = await axios.get(`http://localhost:7000/api/users/preview/${bookId}`);
      const { previewUrl } = res.data.data;
      window.open(previewUrl, '_blank');
    } catch (error) {
      alert("Failed to load preview. Please try again");
      console.error("Preview error:", error);
    }
  };

  const handleDownload = async (bookId, bookName) => {
    if (!user) {
      alert("Log in to download books");
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
      link.setAttribute("download", `${bookName || `book-${bookId}`}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error.message);
      alert("Failed to download book.");
    }
  };

  const handleDelete = async (bookId) => {
    if (!confirm("Do you want to delete this book?")) return;

    try {
      const res = await axios.delete(`http://localhost:7000/api/users/delete/${bookId}`, {
        withCredentials: true,
      });

      alert(res.data?.message || "Book deleted!");
      setBooks((prev) => prev.filter((b) => b._id !== bookId));
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete book");
    }
  };

  const handleUpdate = async (book) => {
    const newAuthor = prompt("New author:", book.author);
    const newBookName = prompt("New book name:", book.bookName);
    const newGenre = prompt("New genre:", book.genre);

    if (!newAuthor || !newBookName || !newGenre) return;

    try {
      const res = await axios.put(
        `http://localhost:7000/api/users/update/${book._id}`,
        { author: newAuthor, bookName: newBookName, genre: newGenre },
        { withCredentials: true }
      );

      alert(res.data?.message || "Book updated!");
      setBooks((prev) =>
        prev.map((b) => (b._id === book._id ? res.data.data : b))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

  if (loading && books.length === 0) {
    return <div className="Loading">Loading books...</div>;
  }

  return (
    <div className="home-page">
      <h2>Welcome to the Book Portal</h2>
      <p>Search, preview, and download books!</p>

      <div className="book-list">
        {books.map((book) => (
          <div key={book._id} className="book-card">
            <h3>{book.bookName}</h3>
            <p>Author: {book.author}</p>
            <div className="book-actions">
              <button onClick={() => handlePreview(book._id)}>Preview</button>
              <button onClick={() => handleDownload(book._id, book.bookName)}>Download</button>
              {user && user._id === book.uploader && (
                <>
                  <button onClick={() => handleUpdate(book)}>Update</button>
                  <button onClick={() => handleDelete(book._id)}>Delete</button>
                </>
              )}
            </div>
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
