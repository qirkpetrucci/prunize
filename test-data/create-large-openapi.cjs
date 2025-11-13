// Create a realistic ~100KB OpenAPI spec by expanding Petstore
const fs = require('fs');
const path = require('path');

const baseSpec = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'openapi/petstore-base.json'), 'utf-8')
);

// Add more realistic paths to reach ~100KB
const additionalPaths = {
  "/api/v1/users": {
    "get": {
      "summary": "List all users",
      "operationId": "listUsers",
      "tags": ["users"],
      "parameters": [
        { "name": "limit", "in": "query", "schema": { "type": "integer", "default": 20 } },
        { "name": "offset", "in": "query", "schema": { "type": "integer", "default": 0 } },
        { "name": "sortBy", "in": "query", "schema": { "type": "string", "enum": ["name", "email", "createdAt"] } },
        { "name": "order", "in": "query", "schema": { "type": "string", "enum": ["asc", "desc"] } }
      ],
      "responses": {
        "200": {
          "description": "Successful response",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "data": { "type": "array", "items": { "$ref": "#/components/schemas/User" } },
                  "pagination": { "$ref": "#/components/schemas/Pagination" }
                }
              }
            }
          }
        }
      }
    },
    "post": {
      "summary": "Create a new user",
      "operationId": "createUser",
      "tags": ["users"],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/CreateUserRequest" }
          }
        }
      },
      "responses": {
        "201": {
          "description": "User created",
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/User" }
            }
          }
        }
      }
    }
  },
  "/api/v1/users/{userId}": {
    "get": {
      "summary": "Get user by ID",
      "operationId": "getUserById",
      "tags": ["users"],
      "parameters": [
        { "name": "userId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
      ],
      "responses": {
        "200": {
          "description": "User details",
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/User" }
            }
          }
        },
        "404": {
          "description": "User not found",
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/Error" }
            }
          }
        }
      }
    },
    "put": {
      "summary": "Update user",
      "operationId": "updateUser",
      "tags": ["users"],
      "parameters": [
        { "name": "userId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
      ],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/UpdateUserRequest" }
          }
        }
      },
      "responses": {
        "200": {
          "description": "User updated",
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/User" }
            }
          }
        }
      }
    },
    "delete": {
      "summary": "Delete user",
      "operationId": "deleteUser",
      "tags": ["users"],
      "parameters": [
        { "name": "userId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
      ],
      "responses": {
        "204": { "description": "User deleted" },
        "404": { "description": "User not found" }
      }
    }
  },
  "/api/v1/products": {
    "get": {
      "summary": "List products",
      "operationId": "listProducts",
      "tags": ["products"],
      "parameters": [
        { "name": "category", "in": "query", "schema": { "type": "string" } },
        { "name": "minPrice", "in": "query", "schema": { "type": "number" } },
        { "name": "maxPrice", "in": "query", "schema": { "type": "number" } },
        { "name": "inStock", "in": "query", "schema": { "type": "boolean" } }
      ],
      "responses": {
        "200": {
          "description": "Product list",
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "products": { "type": "array", "items": { "$ref": "#/components/schemas/Product" } },
                  "total": { "type": "integer" }
                }
              }
            }
          }
        }
      }
    }
  },
  "/api/v1/orders": {
    "get": {
      "summary": "List orders",
      "operationId": "listOrders",
      "tags": ["orders"],
      "parameters": [
        { "name": "status", "in": "query", "schema": { "type": "string", "enum": ["pending", "processing", "shipped", "delivered", "cancelled"] } },
        { "name": "customerId", "in": "query", "schema": { "type": "string", "format": "uuid" } }
      ],
      "responses": {
        "200": {
          "description": "Order list",
          "content": {
            "application/json": {
              "schema": {
                "type": "array",
                "items": { "$ref": "#/components/schemas/Order" }
              }
            }
          }
        }
      }
    },
    "post": {
      "summary": "Create order",
      "operationId": "createOrder",
      "tags": ["orders"],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/CreateOrderRequest" }
          }
        }
      },
      "responses": {
        "201": {
          "description": "Order created",
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/Order" }
            }
          }
        }
      }
    }
  },
  "/api/v1/orders/{orderId}": {
    "get": {
      "summary": "Get order by ID",
      "operationId": "getOrderById",
      "tags": ["orders"],
      "parameters": [
        { "name": "orderId", "in": "path", "required": true, "schema": { "type": "string", "format": "uuid" } }
      ],
      "responses": {
        "200": {
          "description": "Order details",
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/Order" }
            }
          }
        }
      }
    }
  },
  "/api/v1/payments": {
    "post": {
      "summary": "Process payment",
      "operationId": "processPayment",
      "tags": ["payments"],
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": { "$ref": "#/components/schemas/PaymentRequest" }
          }
        }
      },
      "responses": {
        "200": {
          "description": "Payment successful",
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/PaymentResponse" }
            }
          }
        }
      }
    }
  },
  "/api/v1/analytics/reports": {
    "get": {
      "summary": "Get analytics report",
      "operationId": "getAnalyticsReport",
      "tags": ["analytics"],
      "parameters": [
        { "name": "startDate", "in": "query", "required": true, "schema": { "type": "string", "format": "date" } },
        { "name": "endDate", "in": "query", "required": true, "schema": { "type": "string", "format": "date" } },
        { "name": "metrics", "in": "query", "schema": { "type": "array", "items": { "type": "string" } } }
      ],
      "responses": {
        "200": {
          "description": "Analytics report",
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/AnalyticsReport" }
            }
          }
        }
      }
    }
  }
};

// Add additional schemas
const additionalSchemas = {
  "User": {
    "type": "object",
    "properties": {
      "id": { "type": "string", "format": "uuid" },
      "email": { "type": "string", "format": "email" },
      "name": { "type": "string" },
      "role": { "type": "string", "enum": ["admin", "user", "guest"] },
      "status": { "type": "string", "enum": ["active", "inactive", "suspended"] },
      "createdAt": { "type": "string", "format": "date-time" },
      "updatedAt": { "type": "string", "format": "date-time" },
      "metadata": { "type": "object", "additionalProperties": true }
    }
  },
  "CreateUserRequest": {
    "type": "object",
    "required": ["email", "name"],
    "properties": {
      "email": { "type": "string", "format": "email" },
      "name": { "type": "string", "minLength": 1, "maxLength": 100 },
      "password": { "type": "string", "minLength": 8, "maxLength": 128 },
      "role": { "type": "string", "enum": ["admin", "user", "guest"], "default": "user" }
    }
  },
  "UpdateUserRequest": {
    "type": "object",
    "properties": {
      "name": { "type": "string" },
      "role": { "type": "string", "enum": ["admin", "user", "guest"] },
      "status": { "type": "string", "enum": ["active", "inactive", "suspended"] }
    }
  },
  "Product": {
    "type": "object",
    "properties": {
      "id": { "type": "string", "format": "uuid" },
      "name": { "type": "string" },
      "description": { "type": "string" },
      "price": { "type": "number", "minimum": 0 },
      "category": { "type": "string" },
      "inStock": { "type": "boolean" },
      "quantity": { "type": "integer", "minimum": 0 },
      "images": { "type": "array", "items": { "type": "string", "format": "uri" } }
    }
  },
  "Order": {
    "type": "object",
    "properties": {
      "id": { "type": "string", "format": "uuid" },
      "customerId": { "type": "string", "format": "uuid" },
      "status": { "type": "string", "enum": ["pending", "processing", "shipped", "delivered", "cancelled"] },
      "items": { "type": "array", "items": { "$ref": "#/components/schemas/OrderItem" } },
      "totalAmount": { "type": "number", "minimum": 0 },
      "shippingAddress": { "$ref": "#/components/schemas/Address" },
      "createdAt": { "type": "string", "format": "date-time" }
    }
  },
  "OrderItem": {
    "type": "object",
    "properties": {
      "productId": { "type": "string", "format": "uuid" },
      "quantity": { "type": "integer", "minimum": 1 },
      "price": { "type": "number", "minimum": 0 }
    }
  },
  "CreateOrderRequest": {
    "type": "object",
    "required": ["items", "shippingAddress"],
    "properties": {
      "items": { "type": "array", "items": { "$ref": "#/components/schemas/OrderItem" } },
      "shippingAddress": { "$ref": "#/components/schemas/Address" },
      "notes": { "type": "string" }
    }
  },
  "Address": {
    "type": "object",
    "properties": {
      "street": { "type": "string" },
      "city": { "type": "string" },
      "state": { "type": "string" },
      "zipCode": { "type": "string" },
      "country": { "type": "string" }
    }
  },
  "PaymentRequest": {
    "type": "object",
    "required": ["orderId", "method", "amount"],
    "properties": {
      "orderId": { "type": "string", "format": "uuid" },
      "method": { "type": "string", "enum": ["credit_card", "debit_card", "paypal", "bank_transfer"] },
      "amount": { "type": "number", "minimum": 0 },
      "currency": { "type": "string", "default": "USD" }
    }
  },
  "PaymentResponse": {
    "type": "object",
    "properties": {
      "transactionId": { "type": "string" },
      "status": { "type": "string", "enum": ["success", "failed", "pending"] },
      "processedAt": { "type": "string", "format": "date-time" }
    }
  },
  "AnalyticsReport": {
    "type": "object",
    "properties": {
      "period": {
        "type": "object",
        "properties": {
          "startDate": { "type": "string", "format": "date" },
          "endDate": { "type": "string", "format": "date" }
        }
      },
      "metrics": {
        "type": "object",
        "properties": {
          "totalRevenue": { "type": "number" },
          "totalOrders": { "type": "integer" },
          "averageOrderValue": { "type": "number" },
          "topProducts": { "type": "array", "items": { "$ref": "#/components/schemas/Product" } }
        }
      }
    }
  },
  "Pagination": {
    "type": "object",
    "properties": {
      "total": { "type": "integer" },
      "limit": { "type": "integer" },
      "offset": { "type": "integer" },
      "hasMore": { "type": "boolean" }
    }
  },
  "Error": {
    "type": "object",
    "properties": {
      "code": { "type": "string" },
      "message": { "type": "string" },
      "details": { "type": "object", "additionalProperties": true }
    }
  }
};

// Merge paths and schemas
baseSpec.paths = { ...baseSpec.paths, ...additionalPaths };
baseSpec.components = baseSpec.components || {};
baseSpec.components.schemas = { ...baseSpec.components.schemas, ...additionalSchemas };

// Write output
const output = JSON.stringify(baseSpec, null, 2);
fs.writeFileSync(
  path.join(__dirname, 'openapi/large-api-spec.json'),
  output
);

console.log(`Created large-api-spec.json (${(output.length / 1024).toFixed(1)}KB)`);
