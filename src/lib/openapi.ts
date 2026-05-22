export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Chapkey Recap API",
    version: "1.0.0",
    description:
      "Documentation Swagger des endpoints backend de Chapkey Recap.",
  },
  servers: [{ url: "/", description: "Current server" }],
  tags: [
    { name: "Auth", description: "Authentification et session" },
    { name: "Clients", description: "Gestion des clients" },
    { name: "Transactions", description: "Gestion des transactions" },
    { name: "Dashboard", description: "KPIs et analytics" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "chapkey_session",
      },
    },
    schemas: {
      ApiError: {
        type: "object",
        properties: {
          error: { type: "string", example: "Erreur serveur" },
          details: { type: "object", nullable: true },
        },
        required: ["error"],
      },
      LoginRequest: {
        type: "object",
        properties: {
          email: { type: "string", format: "email", example: "admin@cambis.local" },
          password: { type: "string", example: "Admin12345!" },
        },
        required: ["email", "password"],
      },
      ClientPayload: {
        type: "object",
        properties: {
          fullName: { type: "string", minLength: 2, maxLength: 100 },
          nickname: { type: "string", maxLength: 50, nullable: true },
          phone: { type: "string", maxLength: 20, nullable: true },
          note: { type: "string", maxLength: 500, nullable: true },
          isActive: { type: "boolean" },
        },
      },
      TransactionPayload: {
        type: "object",
        properties: {
          clientId: { type: "string" },
          operationType: { type: "string", enum: ["BUY_NAIRA", "SELL_NAIRA"] },
          amountCfa: { type: "number", format: "float" },
          amountNaira: { type: "number", format: "float" },
          exchangeRate: { type: "number", format: "float" },
          note: { type: "string", nullable: true },
        },
        required: ["clientId", "operationType", "amountCfa", "amountNaira", "exchangeRate"],
      },
    },
  },
  paths: {
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Connexion utilisateur",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": { description: "Connecté" },
          "400": { description: "Validation invalide" },
          "401": { description: "Identifiants invalides" },
          "500": {
            description: "Erreur serveur",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" },
              },
            },
          },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Déconnexion utilisateur",
        responses: {
          "302": { description: "Redirection vers /login" },
        },
      },
    },
    "/api/clients": {
      get: {
        tags: ["Clients"],
        summary: "Lister les clients",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "q",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Recherche nom/surnom/téléphone",
          },
        ],
        responses: {
          "200": { description: "Liste des clients" },
          "401": { description: "Non autorisé" },
        },
      },
      post: {
        tags: ["Clients"],
        summary: "Créer un client",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ClientPayload" },
            },
          },
        },
        responses: {
          "201": { description: "Client créé" },
          "400": { description: "Validation invalide" },
          "401": { description: "Non autorisé" },
        },
      },
    },
    "/api/clients/search": {
      get: {
        tags: ["Clients"],
        summary: "Recherche rapide clients (top 10)",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "q",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Résultats de recherche" },
          "401": { description: "Non autorisé" },
        },
      },
    },
    "/api/clients/{id}": {
      get: {
        tags: ["Clients"],
        summary: "Détail d'un client",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Détail client" },
          "404": { description: "Client introuvable" },
          "401": { description: "Non autorisé" },
        },
      },
      patch: {
        tags: ["Clients"],
        summary: "Mettre à jour un client",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ClientPayload" },
            },
          },
        },
        responses: {
          "200": { description: "Client mis à jour" },
          "400": { description: "Validation invalide" },
          "401": { description: "Non autorisé" },
        },
      },
    },
    "/api/clients/{id}/stats": {
      get: {
        tags: ["Clients"],
        summary: "Stats d'un client",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Statistiques client" },
          "404": { description: "Client introuvable" },
          "401": { description: "Non autorisé" },
        },
      },
    },
    "/api/clients/{id}/transactions": {
      get: {
        tags: ["Clients"],
        summary: "Transactions d'un client",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": { description: "Historique transaction client" },
          "404": { description: "Client introuvable" },
          "401": { description: "Non autorisé" },
        },
      },
    },
    "/api/transactions": {
      get: {
        tags: ["Transactions"],
        summary: "Lister les transactions",
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: "clientId",
            in: "query",
            schema: { type: "string" },
            required: false,
          },
          {
            name: "operationType",
            in: "query",
            schema: { type: "string", enum: ["BUY_NAIRA", "SELL_NAIRA"] },
            required: false,
          },
          {
            name: "from",
            in: "query",
            schema: { type: "string", format: "date" },
            required: false,
          },
          {
            name: "to",
            in: "query",
            schema: { type: "string", format: "date" },
            required: false,
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 500 },
            required: false,
          },
        ],
        responses: {
          "200": { description: "Liste des transactions" },
          "401": { description: "Non autorisé" },
        },
      },
      post: {
        tags: ["Transactions"],
        summary: "Créer une transaction",
        security: [{ cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TransactionPayload" },
            },
          },
        },
        responses: {
          "201": { description: "Transaction créée" },
          "400": { description: "Validation invalide" },
          "401": { description: "Non autorisé" },
          "404": { description: "Client introuvable" },
        },
      },
    },
    "/api/dashboard": {
      get: {
        tags: ["Dashboard"],
        summary: "Récupérer les KPIs dashboard",
        security: [{ cookieAuth: [] }],
        responses: {
          "200": { description: "Données dashboard" },
          "401": { description: "Non autorisé" },
        },
      },
    },
  },
} as const;
