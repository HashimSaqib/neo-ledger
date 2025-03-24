import { defineBoot } from "#q-app/wrappers";
import axios from "axios";
import { Notify, Cookies } from "quasar"; // Import Cookies from Quasar
import config from "../../neoledger.json";

// Create a new Axios instance
const api = axios.create();

// Function to get the current API URL based on the router's current route parameters
const getCurrentUrl = (router) => {
  const currentRoute = router.currentRoute?.value;
  if (currentRoute && currentRoute.params && currentRoute.params.client) {
    return `${config.apiurl}/client/${currentRoute.params.client}`.replace(
      /\/+$/,
      ""
    );
  }
  return config.apiurl.replace(/\/+$/, "");
};

export default defineBoot(({ app, router, urlPath, publicPath }) => {
  // Set up the Axios request interceptor using the router to set the base URL dynamically.
  api.interceptors.request.use(
    (axiosConfig) => {
      axiosConfig.baseURL = getCurrentUrl(router);

      // Retrieve the sessionkey from cookies using Quasar's Cookies functions
      const sessionkey = Cookies.get("sessionkey");
      if (sessionkey) {
        axiosConfig.headers.Authorization = sessionkey;
      }

      console.log(
        "Request URL:",
        axiosConfig.baseURL + axiosConfig.url + sessionkey
      );
      return axiosConfig;
    },
    (error) => Promise.reject(error)
  );

  // Axios response interceptor to handle errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        const status = error.response.status;
        if (status === 401) {
          console.warn("Session validation failed, redirecting to login");
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

  // Inject Axios and our API instance into Vue's global properties.
  // This lets you access them in your Vue components via this.$axios and this.$api.
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };
