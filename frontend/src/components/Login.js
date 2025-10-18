import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";


import { login as authLogin } from "../store/AuthSlice";
import authService from "../services/authService";
import Input from "./Input"; // Assuming you have a custom Input component
import "./Login.css"; 

function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { register, handleSubmit } = useForm();
  const [error, setError] = useState("");

  const handleLogin = async (data) => {
    setError("");
    try {
      const response = await authService.login(data.email, data.password);
      
      if (response && response.user) {
        dispatch(authLogin(response.user));
        navigate("/"); 
      }
    } catch (err) {
      setError("Login failed. Please check your credentials.");
      console.error("Login Error:", err);
    }
  };

  return (
    <div className="login-container">
      <h2>Login to your account</h2>
      
      <p>
        Don't have an account? <Link to="/signup">Sign up here</Link>
      </p>

      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit(handleLogin)} className="login-form">
        <div className="input-group">
          <label>Email:</label>
          <Input
            placeholder="Enter your email"
            type="email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                message: "Invalid email format",
              },
            })}
          />
        </div>

        <div className="input-group">
          <label>Password:</label>
          <Input
            type="password"
            placeholder="Enter your password"
            {...register("password", {
              required: "Password is required",
            })}
          />
        </div>

        <button type="submit" className="login-button">Login</button>
      </form>
    </div>
  );
}

export default Login;