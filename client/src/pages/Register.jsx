import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Register = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { setUser } = useAuth();

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await axios.post(
        "http://localhost:7000/api/users/register",
        formData,
        {
          withCredentials: true
        }
      );

      const loginResult = await axios.post(
        "http://localhost:7000/api/users/login",
        formData,
        { withCredentials: true }
      );

      setUser(loginResult.data.data.user);

      setSuccess("Registration successful!");

      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err) {
      if (err.response?.status === 409) {
        setError("Username already exists. Please choose a different one.");
      } else {
        setError(err.response?.data?.message || "Registration failed");
      }
    }

  };

  return (
    <div className="register-form">
      <h2>Register</h2>

      <form onSubmit={handleSubmit}>
        <label>Username:</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
        />

        <label>Password:</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit">Register</button>
      </form>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
    </div>
  );
};

export default Register;
