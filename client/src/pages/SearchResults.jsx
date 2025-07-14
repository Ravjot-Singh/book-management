import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "react-router-dom";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [results, setResults] = useState([]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/users/search?${searchParams.toString()}`
        );
        setResults(response.data.data?.previews || []);
      } catch (error) {
        console.error("Search failed:", error.message);
      }
    };

    fetchBooks();
  }, [searchParams]);

  return (
    <div>
      <h2>Search Results</h2>
      {results.length === 0 ? (
        <p>No results found.</p>
      ) : (
        <ul>
          {results.map((book, idx) => (
            <li key={idx}>
              <strong>{book.title}</strong> –{" "}
              <a href={book.previewUrl} target="_blank" rel="noopener noreferrer">
                Preview
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchResults;
