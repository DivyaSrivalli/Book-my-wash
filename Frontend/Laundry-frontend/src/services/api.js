const API_URL = import.meta.env.VITE_API_URL;

const apiRequest = async (endpoint, options = {}) => {

    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",
                ...options.headers
            }
        }
    );

    const data = await response.json();

    // JWT expired or invalid
    if (response.status === 401) {

        localStorage.removeItem("token");

        window.location.reload();

        return;
    }

    if (!response.ok) {

        throw new Error(
            data.message || "Something went wrong"
        );
    }

    return data;
};

export { apiRequest, API_URL };