import { BrowserRouter, Routes, Route } from "react-router-dom";

// ==========================================
// CUSTOMER PAGES
// ==========================================

import Marketplace from "./pages/Marketplace";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";

import CustomerLogin from "./pages/CustomerLogin";
import CustomerRegister from "./pages/CustomerRegister";

import Profile from "./pages/Profile";

// ==========================================
// FARMER PAGES
// ==========================================

import FarmerLogin from "./pages/FarmerLogin";
import FarmerRegister from "./pages/FarmerRegister";
import FarmerDashboard from "./pages/FarmerDashboard";

// IMPORTANT:
// FarmerAddProduct is inside pages/farmer/
import FarmerAddProduct from "./pages/farmer/FarmerAddProduct";

import FarmerEditProduct from "./pages/FarmerEditProduct";
import FarmerOrders from "./pages/FarmerOrders";
import FarmerOrderDetails from "./pages/FarmerOrderDetails";

import FarmerAnalytics from "./pages/farmer/FarmerAnalytics";
import FarmerAI from "./pages/farmer/FarmerAI";

// ==========================================
// ADMIN PAGES
// ==========================================

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminFarmers from "./pages/admin/AdminFarmers";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import FarmerProducts from "./pages/farmer/FarmerProducts";
// ==========================================
// APP
// ==========================================

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* ==========================================
                    CUSTOMER
                ========================================== */}

                <Route
                    path="/"
                    element={<Marketplace />}
                />

                <Route
                    path="/marketplace"
                    element={<Marketplace />}
                />

                <Route
                    path="/product/:id"
                    element={<ProductDetails />}
                />

                <Route
                    path="/cart"
                    element={<Cart />}
                />

                <Route
                    path="/checkout"
                    element={<Checkout />}
                />

                <Route
                    path="/orders"
                    element={<Orders />}
                />

                <Route
                    path="/orders/:id"
                    element={<OrderDetails />}
                />

                <Route
                    path="/login"
                    element={<CustomerLogin />}
                />

                <Route
                    path="/register"
                    element={<CustomerRegister />}
                />

                <Route
                    path="/profile"
                    element={<Profile />}
                />


                {/* ==========================================
                    FARMER AUTH
                ========================================== */}

                <Route
                    path="/farmer/login"
                    element={<FarmerLogin />}
                />

                <Route
                    path="/farmer/register"
                    element={<FarmerRegister />}
                />


                {/* ==========================================
                    FARMER DASHBOARD
                ========================================== */}

                <Route
                    path="/farmer/dashboard"
                    element={<FarmerDashboard />}
                />


                {/* ==========================================
                    FARMER PRODUCTS
                ========================================== */}

                <Route
                    path="/farmer/products/add"
                    element={<FarmerAddProduct />}
                />

                <Route
                    path="/farmer/products/edit/:id"
                    element={<FarmerEditProduct />}
                />


                {/* ==========================================
                    FARMER ORDERS
                ========================================== */}

                <Route
                    path="/farmer/orders"
                    element={<FarmerOrders />}
                />

                <Route
                    path="/farmer/orders/:id"
                    element={<FarmerOrderDetails />}
                />


                {/* ==========================================
                    FARMER ANALYTICS
                ========================================== */}

                <Route
                    path="/farmer/analytics"
                    element={<FarmerAnalytics />}
                />


                {/* ==========================================
                    FARMER AI ASSISTANT
                ========================================== */}

                <Route
                    path="/farmer/ai"
                    element={<FarmerAI />}
                />


                {/* ==========================================
                    ADMIN AUTH
                ========================================== */}

                <Route
                    path="/admin/login"
                    element={<AdminLogin />}
                />


                {/* ==========================================
                    ADMIN DASHBOARD
                ========================================== */}

                <Route
                    path="/admin/dashboard"
                    element={<AdminDashboard />}
                />


                {/* ==========================================
                    ADMIN FARMERS
                ========================================== */}

                <Route
                    path="/admin/farmers"
                    element={<AdminFarmers />}
                />


                {/* ==========================================
                    ADMIN CUSTOMERS
                ========================================== */}

                <Route
                    path="/admin/customers"
                    element={<AdminCustomers />}
                />


                {/* ==========================================
                    ADMIN PRODUCTS
                ========================================== */}

                <Route
                    path="/admin/products"
                    element={<AdminProducts />}
                />


                {/* ==========================================
                    ADMIN ORDERS
                ========================================== */}

                <Route
                    path="/admin/orders"
                    element={<AdminOrders />}
                />
                <Route
                    path="/farmer/products"
                    element={<FarmerProducts />}
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;