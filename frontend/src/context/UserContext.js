import { createContext, useContext, useEffect, useState } from "react";
import userService from "../services/userService";


const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch user profile from backend
  const fetchProfile = async () => {
    try {
      const profile = await userService.getProfile();
      setUser(profile);
      return profile;
    } catch (error) {
      console.error("Failed to load profile", error);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Run once on mount to load user if token exists
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  // ✅ Helper for login: store token + fetch user
  const login = async (credentials) => {
    try {
      const data = await userService.login(credentials);
      localStorage.setItem("token", data.token);
      await fetchProfile(); // load user after login
      return data;
    } catch (error) {
      throw error;
    }
  };

  // ✅ Helper for signup
  const signup = async (formData) => {
    try {
      const data = await userService.signup(formData);
      localStorage.setItem("token", data.token);
      await fetchProfile(); // load user after signup
      return data;
    } catch (error) {
      throw error;
    }
  };

  // ✅ Logout clears token + user
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <UserContext.Provider
      value={{ user, setUser, loading, fetchProfile, login, signup, logout }}
    >
      {children}
    </UserContext.Provider>
  );
};
