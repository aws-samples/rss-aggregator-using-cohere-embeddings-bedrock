import { refreshToken } from "../networking/auth";

export const authFetch = async (URI: string, options : RequestInit = {}) => {
    const tokenExpiry = localStorage.getItem("expiryDate");

    if (!tokenExpiry) { 
        throw new Error("No token expiry date found");
    }

    if (Date.now() >= parseInt(tokenExpiry)) {
        await refreshToken()
    }

    const authToken = localStorage.getItem("idToken");

    const newOptions = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${authToken}`,
        },
    }
    const res = await fetch(URI, newOptions);
    return res;
}