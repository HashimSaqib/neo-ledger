import { route } from "quasar/wrappers";
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";
import routes from "./routes";
import { Cookies, Notify } from "quasar";

export default route(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === "history"
    ? createWebHistory
    : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createMemoryHistory(),
  });

  Router.beforeEach((to, from, next) => {
    // Retrieve user permissions from cookies.
    let acs = Cookies.get("acs");
    try {
      acs = acs ? (typeof acs === "string" ? JSON.parse(acs) : acs) : [];
    } catch (e) {
      acs = [];
    }

    let requiredPerm = to.meta && to.meta.permission;
    // If the permission is defined as a function, call it with the current route.
    if (typeof requiredPerm === "function") {
      requiredPerm = requiredPerm(to);
    }
    // If the permission is an array, allow if at least one permission is present.
    if (Array.isArray(requiredPerm)) {
      const hasPermission = requiredPerm.some((perm) => acs.includes(perm));
      if (hasPermission) {
        next();
      } else {
        Notify.create({
          type: "negative",
          message: "You do not have permission to access this page.",
        });
        next(false);
      }
    }
    // Otherwise, if a permission is defined as a string, check for it.
    else if (requiredPerm) {
      if (acs.includes(requiredPerm)) {
        next();
      } else {
        Notify.create({
          type: "negative",
          message: "Permission denied",
          position: "center",
        });
        next(false);
      }
    }
    // If no permission is defined, simply allow navigation.
    else {
      next();
    }
  });

  return Router;
});
