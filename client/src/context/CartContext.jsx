import { createContext, useContext, useEffect, useState } from "react";
import API from "../services/api";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(null);
    const [cartCount, setCartCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchCart = async () => {
        try {
            const token = localStorage.getItem("customerToken");

            if (!token) {
                setCart(null);
                setCartCount(0);
                return;
            }

            setLoading(true);

            const response = await API.get("/cart", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const cartData = response.data.cart;

            setCart(cartData);

            const totalItems = cartData.items.reduce(
                (total, item) => total + item.quantity,
                0
            );

            setCartCount(totalItems);

        } catch (error) {
            console.error("Fetch cart error:", error);
            setCart(null);
            setCartCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
    }, []);

    const refreshCart = () => {
        fetchCart();
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                cartCount,
                loading,
                refreshCart
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    return useContext(CartContext);
};