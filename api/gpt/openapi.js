import { json, methodNotAllowed } from "../../lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return methodNotAllowed(res);
  }

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const baseUrl = `${proto}://${host}`;

  return json(res, 200, buildSchema(baseUrl));
}

function buildSchema(baseUrl) {
  return {
    openapi: "3.1.0",
    info: {
      title: "Nextvolt Facebook Control API",
      version: "1.0.0",
      description: "Read Facebook page reports, review comments, reply to comments, and pause or resume Meta ads."
    },
    servers: [{ url: baseUrl }],
    components: {
      securitySchemes: {
        GptActionSecret: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "GPT_ACTION_SECRET"
        }
      },
      schemas: {
        AdStatusUpdate: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["ACTIVE", "PAUSED"],
              description: "Use PAUSED to stop an ad and ACTIVE to resume it."
            }
          },
          required: ["status"]
        },
        CommentReply: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Reply text to publish under the Facebook comment."
            }
          },
          required: ["message"]
        }
      }
    },
    security: [{ GptActionSecret: [] }],
    paths: {
      "/api/gpt/summary": {
        get: {
          operationId: "getFacebookBusinessSummary",
          summary: "Get Facebook business summary",
          description: "Returns ad insights, recent posts, recent comments, and ads for the connected business.",
          responses: {
            "200": {
              description: "Business summary"
            }
          }
        }
      },
      "/api/gpt/ads/{adId}": {
        patch: {
          operationId: "updateMetaAdStatus",
          summary: "Pause or resume a Meta ad",
          description: "Updates an ad status. Ask for user confirmation before changing status.",
          parameters: [
            {
              name: "adId",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Meta ad ID."
            }
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdStatusUpdate" }
              }
            }
          },
          responses: {
            "200": {
              description: "Ad updated"
            }
          }
        }
      },
      "/api/gpt/comments/{commentId}/reply": {
        post: {
          operationId: "replyToFacebookComment",
          summary: "Reply to a Facebook comment",
          description: "Publishes a reply under a Facebook comment. Ask for user confirmation before publishing.",
          parameters: [
            {
              name: "commentId",
              in: "path",
              required: true,
              schema: { type: "string" },
              description: "Facebook comment ID."
            }
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CommentReply" }
              }
            }
          },
          responses: {
            "200": {
              description: "Comment reply created"
            }
          }
        }
      }
    }
  };
}
