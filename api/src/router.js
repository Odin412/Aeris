import { parse } from "url";

export class Router {
  constructor() {
    this.routes = [];
  }

  register(method, path, handler) {
    this.routes.push({ method: method.toUpperCase(), path, handler });
  }

  match(method, pathname) {
    for (const route of this.routes) {
      if (route.method !== method.toUpperCase()) continue;
      const params = {};
      const routeParts = route.path.split("/").filter(Boolean);
      const pathParts = pathname.split("/").filter(Boolean);
      if (routeParts.length !== pathParts.length) continue;
      let matches = true;
      for (let i = 0; i < routeParts.length; i += 1) {
        const rp = routeParts[i];
        const pp = pathParts[i];
        if (rp.startsWith(":")) {
          params[rp.slice(1)] = decodeURIComponent(pp);
        } else if (rp === "*") {
          params["wildcard"] = decodeURIComponent(pathParts.slice(i).join("/"));
          break;
        } else if (rp !== pp) {
          matches = false;
          break;
        }
      }
      if (matches) {
        return { handler: route.handler, params };
      }
    }
    return null;
  }

  async handle(req, res, context) {
    const { pathname, query } = parse(req.url, true);
    const match = this.match(req.method, pathname);
    if (!match) {
      return false;
    }
    req.params = match.params;
    req.query = query || {};
    try {
      await match.handler(req, res, context);
    } catch (error) {
      const message = error && error.message ? error.message : "Internal Server Error";
      res.writeHead(error.statusCode || 500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: message }));
    }
    return true;
  }
}
