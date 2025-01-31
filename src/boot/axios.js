// Import necessary modules and plugins
import axios from "axios";
import { Cookies, Notify } from "quasar";
import router from "/src/router/index";
import config from "../../neoledger.json";

// Create base axios instance
const api = axios.create();

// Function to get the current URL with client
const getCurrentUrl = () => {
  const client = Cookies.get("client");
  return `${config.apiurl}/${client || ""}`.replace(/\/+$/, "");
};

// Axios request interceptor
api.interceptors.request.use(
  (config) => {
    // Update the base URL for each request
    config.baseURL = getCurrentUrl();

    const sessionKey = Cookies.get("sessionkey");
    if (sessionKey) {
      config.headers["Authorization"] = `${sessionKey}`;
    }

    // Log the final URL for debugging
    console.log("Request URL:", config.baseURL + config.url);

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Axios response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        console.warn("Session validation failed, redirecting to login");
        router.push("/login");
      } else if (status === 403 || status === 500) {
        const errorMessage =
          error.response.data.message ||
          "An unexpected error occurred. Please try again later.";
        Notify.create({
          type: "negative",
          message: `Error ${status}: ${errorMessage}`,
          position: "center",
        });
      }
    } else if (error.request) {
      Notify.create({
        type: "negative",
        message:
          "No response received from the server. Please check your network.",
        position: "top-right",
        timeout: 3000,
      });
    } else {
      Notify.create({
        type: "negative",
        message: `Request error: ${error.message}`,
        position: "top-right",
        timeout: 3000,
      });
    }
    return Promise.reject(error);
  }
);

export { api };
