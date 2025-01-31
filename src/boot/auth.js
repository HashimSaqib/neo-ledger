import { boot } from "quasar/wrappers";
import { Cookies } from "quasar";
import { api } from "src/boot/axios";

export default boot(({ router }) => {
  router.beforeEach(async (to, from, next) => {
    // Skip auth check for the login route
    if (to.path === "/login") {
      return next();
    }

    const sessionKey = Cookies.get("sessionkey");
    const client = Cookies.get("client");

    if (!sessionKey || !client) {
      console.log("Session key or client not found, redirecting to login");
      return next("/login");
    }
    next();
  });
});
