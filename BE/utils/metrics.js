import client from "prom-client";

const register = new client.Registry();

const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "route", "statusCode"],
});

const getBaseRoute = (url) => {
  const path = url.split("?")[0];
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return "/";
  return "/" + parts[1] || "/"; 
};


register.registerMetric(httpRequestCounter);

const metricsMiddleware = (req, res, next) => {
    
  if (req.originalUrl === "/favicon.ico" || req.originalUrl === "/metrics") {
    return next();
  }
  

  res.on("finish", () => {
    const baseRoute = getBaseRoute(req.originalUrl);
    httpRequestCounter
      .labels(req.method, baseRoute, res.statusCode.toString())
      .inc();
  });
  next();
};

const metricsEndpoint = async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
};

export { register, metricsMiddleware, metricsEndpoint };