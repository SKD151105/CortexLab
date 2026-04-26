import axios from "axios";
import { API_PATHS, BASE_URL } from "./apiPaths";

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: {
        Accept: "application/json",
    },
});

let refreshPromise = null;

const clearSessionAndRedirect = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    if (window.location.pathname !== "/login") {
        window.location.href = "/login";
    }
};

const getRefreshedToken = async () => {
    const storedRefreshToken = localStorage.getItem("refreshToken");
    if (!storedRefreshToken) {
        throw new Error("Missing refresh token");
    }

    const response = await axios.post(`${BASE_URL}${API_PATHS.AUTH.REFRESH_TOKEN}`, {
        refreshToken: storedRefreshToken,
    });

    const nextAccessToken = response.data?.accessToken || response.data?.token;
    const nextRefreshToken = response.data?.refreshToken;
    const user = response.data?.user || response.data?.data?.user;

    if (!nextAccessToken || !nextRefreshToken) {
        throw new Error("Invalid refresh response");
    }

    localStorage.setItem("token", nextAccessToken);
    localStorage.setItem("refreshToken", nextRefreshToken);
    if (user) {
        localStorage.setItem("user", JSON.stringify(user));
    }

    return nextAccessToken;
};

// Request Interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        if (config.data instanceof FormData) {
            delete config.headers["Content-Type"];
        } else {
            config.headers["Content-Type"] = "application/json";
        }

        const accessToken = localStorage.getItem("token");
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        if (error.response) {
            const originalRequest = error.config;

            if (
                error.response.status === 401 &&
                !originalRequest?._retry &&
                !originalRequest?.url?.includes(API_PATHS.AUTH.LOGIN) &&
                !originalRequest?.url?.includes(API_PATHS.AUTH.REGISTER) &&
                !originalRequest?.url?.includes(API_PATHS.AUTH.REFRESH_TOKEN)
            ) {
                originalRequest._retry = true;

                try {
                    if (!refreshPromise) {
                        refreshPromise = getRefreshedToken().finally(() => {
                            refreshPromise = null;
                        });
                    }
                    const accessToken = await refreshPromise;
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return axiosInstance(originalRequest);
                } catch {
                    clearSessionAndRedirect();
                    return Promise.reject(error);
                }
            }

            if (error.response.status === 401) {
                clearSessionAndRedirect();
            }

            if (error.response.status === 500) {
                console.error("Server error. Please try again later.");
            }
        } else if (error.code === "ECONNABORTED") {
            console.error("Request timeout. Please try again.");
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
