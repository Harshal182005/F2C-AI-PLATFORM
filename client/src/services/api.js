import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        "Content-Type": "application/json"
    }
});

API.interceptors.request.use(
    (config) => {

        // ------------------------------------------------
        // If a request already provides Authorization,
        // don't overwrite it.
        // ------------------------------------------------

        if (config.headers?.Authorization) {
            return config;
        }

        const url = config.url || "";

        let token = null;

        // ------------------------------------------------
        // FARMER API
        // ------------------------------------------------

        if (url.startsWith("/farmer/")) {
            token = localStorage.getItem("farmerToken");
        }

        // ------------------------------------------------
        // ADMIN API
        // ------------------------------------------------

        else if (url.startsWith("/admin/")) {
            token = localStorage.getItem("adminToken");
        }

        // ------------------------------------------------
        // CUSTOMER API
        // ------------------------------------------------

        else {
            token = localStorage.getItem("customerToken");
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);

export default API;