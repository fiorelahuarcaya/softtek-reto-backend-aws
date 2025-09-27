import { buildOpenApi } from "../docs/openapi";

/** Devuelve OpenAPI JSON con el `servers[0].url` correcto según el stage */
export const openapi = async (event: any) => {
  const stage = event?.requestContext?.stage ?? "$default";
  const basePath = stage && stage !== "$default" ? `/${stage}` : "";
  const spec = buildOpenApi(basePath);
  return {
    statusCode: 200,
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(spec),
  };
};

/** Sirve Swagger UI usando CDN y apuntando a `openapi.json` relativo (respeta el stage) */
export const ui = async () => {
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Sofftek Reto API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css" />
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>body{margin:0} .topbar{display:none}</style>
</head>
<body>
  <div id="swagger"></div>
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: "openapi.json", // relativo -> /{stage}/openapi.json
        dom_id: "#swagger",
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;
  return {
    statusCode: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
    body: html,
  };
};

export default ui;
