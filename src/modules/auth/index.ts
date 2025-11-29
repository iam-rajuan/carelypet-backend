import router from "./routes/auth.routes";

const authModule = {
  name: "auth",
  basePath: "/auth",
  router,
};

export default authModule;
