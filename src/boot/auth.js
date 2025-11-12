import { boot } from "quasar/wrappers";
import { Cookies } from "quasar";
import { api } from "src/boot/axios";

export default boot(({ router }) => {
  router.beforeEach(async (to, from, next) => {
    // Skip auth check for public routes
    const publicRoutes = ["/login", "/signup", "/2fa/setup", "/2fa/verify"];
    if (publicRoutes.includes(to.path)) {
      return next();
    }

    const sessionKey = Cookies.get("sessionkey");

    if (!sessionKey) {
      console.log("Session key or client not found, redirecting to login");
      return next("/login");
    }

    // Check if the route is under /client/:client/ with additional nested segments.
    // This regex matches paths starting with "/client/", followed by a segment, and then a slash with more content.
    if (/^\/client\/[^\/]+\/.+/.test(to.path)) {
      // We assume the route is defined with a :client param
      const client = to.params.client;
      // Prevent infinite loop: if the user is already at the base client route, don't redirect
      if (to.path !== `/client/${client}`) {
        // Check if the required item exists in local storage
        if (!localStorage.getItem(`${client}_acs`)) {
          console.log(
            `Missing ${client}_acs in local storage, redirecting to base client route`
          );
          return next(`/client/${client}`);
        }
      }
    }

    next();
  });
});
