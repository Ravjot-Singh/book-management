import { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [books, setBooks] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);

  const [totalPages, setTotalPages] = useState(1);

  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const genre = searchParams.get("genre") || "";
  const author = searchParams.get("author") || "";
  const bookName = searchParams.get("bookName") || "";

  useEffect(() => {

    const page = parseInt(searchParams.get("page")) || 1;
    setCurrentPage(page);
  }, [searchParams]);

  useEffect(() => {

    if (!genre && !author && !bookName) return navigate("/");
    fetchSearchResults();

  }, [searchParams]);

  const fetchSearchResults = async () => {

    setLoading(true);
    try {
      const params = new URLSearchParams({
        genre, author, bookName, page: currentPage.toString(), limit: "10",
      });

      const res = await axios.get(`http://localhost:7000/api/users/search?${params}`);

      const { books: results, total, totalPages } = res.data.data || {};
      setBooks(results || []);
      setTotal(total || 0);
      setTotalPages(totalPages || 1);
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const updatePage = (page) => {
    if (page < 1 || page > totalPages) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", page.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePreview = (id) => window.open(`http://localhost:7000/api/users/preview/${id}`, "_blank");

  const handleDownload = async (id, name) => {
    if (!user) return alert("Login required to download");
    try {

      const res = await axios.get(`http://localhost:7000/api/users/download/${id}`, {
        responseType: "blob", withCredentials: true,
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = Object.assign(document.createElement("a"), {
        href: url, download: `${name || `book-${id}`}.pdf`,
      });
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      
      alert("Download failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this book?")) return;
    try {
      await axios.delete(`http://localhost:7000/api/users/delete/${id}`, { withCredentials: true });
      const updated = books.filter((b) => b._id !== id);
      setBooks(updated);
      if (updated.length === 0 && currentPage > 1) updatePage(currentPage - 1);
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const handleUpdate = async (book) => {
    const author = prompt("Author:", book.author);
    const bookName = prompt("Book name:", book.bookName);
    const genre = prompt("Genre:", book.genre || "");
    if (!author || !bookName || !genre) return;
    try {
      const res = await axios.put(`http://localhost:7000/api/users/update/${book._id}`, {
        author, bookName, genre,
      }, { withCredentials: true });
      setBooks((prev) => prev.map((b) => (b._id === book._id ? res.data.data : b)));
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

  const Pagination = () => {
    if (totalPages <= 1) return null;
    const buttons = [];
    const max = 5;
    let start = Math.max(1, currentPage - Math.floor(max / 2));
    let end = Math.min(totalPages, start + max - 1);
    if (end - start < max - 1) start = Math.max(1, end - max + 1);

    if (currentPage > 1) buttons.push(<button key="prev" onClick={() => updatePage(currentPage - 1)}>Prev</button>);
    if (start > 1) buttons.push(<button key="1" onClick={() => updatePage(1)}>1</button>);
    if (start > 2) buttons.push(<span key="start-ellipsis">...</span>);

    for (let i = start; i <= end; i++) {
      buttons.push(
        <button key={i} onClick={() => updatePage(i)} className={i === currentPage ? "active" : ""}>
          {i}
        </button>
      );
    }

    if (end < totalPages - 1) buttons.push(<span key="end-ellipsis">...</span>);
    if (end < totalPages) buttons.push(<button key={totalPages} onClick={() => updatePage(totalPages)}>{totalPages}</button>);
    if (currentPage < totalPages) buttons.push(<button key="next" onClick={() => updatePage(currentPage + 1)}>Next</button>);

    return <div className="pagination">{buttons}</div>;
  };

  return (
    <div className="search-results">
      <h2>Search Results</h2>
      <p>Showing {books.length} of {total} results (Page {currentPage} of {totalPages})</p>

      {loading ? (
        <p>Loading...</p>
      ) : books.length === 0 ? (
        <p>No results found.</p>
      ) : (
        <div className="book-list">
          {books.map((book) => (
            <div key={book._id} className="book-card">
              <h3>{book.bookName}</h3>
              <p><strong>Author:</strong> {book.author}</p>
              {book.genre && <p><strong>Genre:</strong> {book.genre}</p>}
              <div className="book-actions">
                <button onClick={() => handlePreview(book._id)}>Preview</button>
                <button onClick={() => handleDownload(book._id, book.bookName)}>Download</button>
                {user && (
                  <>
                    <button onClick={() => handleUpdate(book)}>Update</button>
                    <button onClick={() => handleDelete(book._id)}>Delete</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination />
    </div>
  );
};

export default SearchResults;