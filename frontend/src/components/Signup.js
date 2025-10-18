import { useState } from "react";
import authService from "../services/authService";
import Input from "./Input";
import "./Signup.css";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../store/AuthSlice";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";

function Signup() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const [serverError, setServerError] = useState("");

    const createAccount = async (data) => {
        setServerError("");
        try {
            const userData = await authService.signup(data.username, data.email, data.password);
            
            if (userData) {
                const currentUser = await authService.getCurrentUser();
                if (currentUser) {
                    dispatch(login(currentUser));
                    navigate("/");
                }
            }
        } catch (error) {

            if (error.response) {
                const errorData = error.response.data;
                const errorMessages = Object.keys(errorData).map(key => 
                    `${key}: ${errorData[key].join(', ')}`
                ).join(' ');
                setServerError(errorMessages);
                console.error("Signup failed:", errorData);
            } else {
                setServerError("An unexpected error occurred. Please try again.");
            }
        }
    };

    return (
        <div className="signup-container">
            <h2>Sign up to create an account</h2>
            <p>Already have an account? <Link to="/login">Sign In</Link></p>

            {serverError && <p className="error-message">{serverError}</p>}

            <form onSubmit={handleSubmit(createAccount)} className="signup-form">
                
           
                <div className="input-group">
                    <label>Username:</label>
                    <Input  
                        placeholder="Choose a username"
                        {...register("username", { required: "Username is required" })}
                    />
                    {errors.username && <p className="error-message">{errors.username.message}</p>}
                </div>

                <div className="input-group">
                    <label>Email:</label>
                    <Input
                        type="email"
                        placeholder="Enter your email"
                        {...register("email", {
                            required: "Email is required",
                            pattern: {
                                value: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                                message: "Invalid email format",
                            },
                        })}
                    />
                    {errors.email && <p className="error-message">{errors.email.message}</p>}
                </div>

                <div className="input-group">
                    <label>Password:</label>
                    <Input  
                        type="password"
                        placeholder="Enter your password"
                        {...register("password", { required: "Password is required" })}
                    />
                    {errors.password && <p className="error-message">{errors.password.message}</p>}
                </div>

                <button type="submit" className="signup-button" disabled={isSubmitting}>
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                </button>
            </form>
        </div>
    );
}

export default Signup;