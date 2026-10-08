import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL
});

API.interceptors.request.use(
    (config) => {

        // ------------------------------------------------
        // If request already provides Authorization,
        // don't overwrite it.
        // ------------------------------------------------

        if (!config.headers?.Authorization) {

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
        }

        // ------------------------------------------------
        // FormData requests
        // Let browser/Axios set Content-Type automatically
        // ------------------------------------------------

        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
        } else {
            config.headers["Content-Type"] = "application/json";
        }

        return config;
    },

    (error) => {
        return Promise.reject(error);
    }
);

export default API;