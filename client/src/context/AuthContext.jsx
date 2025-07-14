import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [loading, setLoading] = useState(true); 

  // Fetch current user using refresh token
  const refreshUser = async () => {
    try {
      const res = await axios.post(
        "http://localhost:7000/api/users/refresh-token",
        {},
        { withCredentials: true } 
      );
      setUser(res.data?.data?.user || null);
    } catch (err) {
      setUser(null); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser(); 
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => useContext(AuthContext);
