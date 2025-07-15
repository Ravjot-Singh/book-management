import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


const Navbar = () => {

  const { user } = useAuth();
  const [genre, setGenre] = useState("");
  const [author, setAuthor] = useState("");
  const [bookName, setBookName] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();

  
    if ([genre, author, bookName].every((field) => !field.trim())) {
      alert("Please enter at least one search field.");
      return;
    }

    
    const queryParams = new URLSearchParams();
    if (genre.trim()) queryParams.append("genre", genre.trim());
    if (author.trim()) queryParams.append("author", author.trim());
    if (bookName.trim()) queryParams.append("bookName", bookName.trim());
    
   
    queryParams.append("page", "1");


    navigate(`/search?${queryParams.toString()}`);

  
    setGenre("");
    setAuthor("");
    setBookName("");
  };

  return (
    <nav className="navbar">
      <div className="nav-links">
        <Link to="/">Home</Link>

        {user ? (
          <>
            <Link to="/upload">Upload File</Link>
            <span>Welcome, {user.username}</span>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Sign Up</Link>
          </>
        )}
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        
        />
        <input
          type="text"
          placeholder="Author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
       
        />
        <input
          type="text"
          placeholder="Book Name"
          value={bookName}
          onChange={(e) => setBookName(e.target.value)}
      
        />
        <button type="submit">Search</button>
      </form>
    </nav>
  );
};

export default Navbar;