import { NextResponse } from "next/server";

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Chapkey Recap API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      :root { color-scheme: light; }
      html, body { margin: 0; padding: 0; background: #f8fafc; }
      #swagger-ui { max-width: 1200px; margin: 0 auto; }
      .topbar { display: none; }
      .swagger-ui,
      .swagger-ui .scheme-container,
      .swagger-ui .opblock-tag,
      .swagger-ui section.models {
        background: #ffffff;
        color: #0f172a;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/api/openapi",
        dom_id: "#swagger-ui",
        deepLinking: true,
        displayRequestDuration: true,
        persistAuthorization: true,
      });
    </script>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}
