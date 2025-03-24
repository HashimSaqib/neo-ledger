import { route } from "quasar/wrappers";
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from "vue-router";
import routes from "./routes";
import { Cookies, LocalStorage, Notify } from "quasar";
export default route(function () {
  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createWebHistory(),
  });

  Router.beforeEach((to, from, next) => {
    if (!to.params.client) {
      next();
      return;
    }

    const client = to.params.client;

    let acs = LocalStorage.getItem(`${client}_acs`);
    try {
      acs = acs ? acs : [];
    } catch (e) {
      acs = [];
    }

    let requiredPerm = to.meta && to.meta.permission;
    if (typeof requiredPerm === "function") {
      requiredPerm = requiredPerm(to);
    }
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
    } else {
      next();
    }
  });

  return Router;
});
