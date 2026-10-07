import { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("customerToken");
        const savedUser = localStorage.getItem("customerUser");

        if (token && savedUser) {
            try {
                setUser(JSON.parse(savedUser));
            } catch (error) {
                console.error("Invalid saved user:", error);
                localStorage.removeItem("customerUser");
            }
        }

        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await API.post("/auth/login", {
                email,
                password
            });

            const { token, user } = response.data;

            if (user.role !== "customer") {
                throw new Error("Please login using a customer account.");
            }

            localStorage.setItem("customerToken", token);
            localStorage.setItem("customerUser", JSON.stringify(user));

            setUser(user);

            return {
                success: true,
                user
            };

        } catch (error) {
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    error.message ||
                    "Login failed"
            };
        }
    };

    const register = async (name, email, password, phone, address) => {
        try {
            const response = await API.post("/auth/register", {
                name,
                email,
                password,
                phone,
                address,
                role: "customer"
            });

            return {
                success: true,
                message: response.data.message
            };

        } catch (error) {
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    "Registration failed"
            };
        }
    };

    const logout = () => {
        localStorage.removeItem("customerToken");
        localStorage.removeItem("customerUser");
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};