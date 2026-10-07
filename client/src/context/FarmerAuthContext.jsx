import { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api";

const FarmerAuthContext = createContext();

export const FarmerAuthProvider = ({ children }) => {
    const [farmer, setFarmer] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("farmerToken");
        const savedFarmer = localStorage.getItem("farmerUser");

        if (token && savedFarmer) {
            try {
                setFarmer(JSON.parse(savedFarmer));
            } catch (error) {
                console.error("Invalid saved farmer:", error);

                localStorage.removeItem("farmerToken");
                localStorage.removeItem("farmerUser");
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

            if (user.role !== "farmer") {
                throw new Error("Please login using a farmer account.");
            }

            localStorage.setItem("farmerToken", token);
            localStorage.setItem(
                "farmerUser",
                JSON.stringify(user)
            );

            setFarmer(user);

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
                    "Farmer login failed"
            };
        }
    };

    const register = async (
        name,
        email,
        password,
        phone,
        address
    ) => {
        try {
            const response = await API.post("/auth/register", {
                name,
                email,
                password,
                phone,
                address,
                role: "farmer"
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
                    "Farmer registration failed"
            };
        }
    };

    const logout = () => {
        localStorage.removeItem("farmerToken");
        localStorage.removeItem("farmerUser");

        setFarmer(null);
    };

    return (
        <FarmerAuthContext.Provider
            value={{
                farmer,
                loading,
                login,
                register,
                logout
            }}
        >
            {children}
        </FarmerAuthContext.Provider>
    );
};

export const useFarmerAuth = () => {
    return useContext(FarmerAuthContext);
};