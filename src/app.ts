import express from "express";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const app = express();
app.use(express.json());
import friendRoutes from "./routes/friendRoutesAuth";
import { Request, Response } from "express";
import { ApiError } from "./errors/errors";
import logger, { stream } from "./middleware/logger";
const morganFormat = process.env.NODE_ENV == "production" ? "combined" : "dev";
const Cors = require("cors");
import { graphqlHTTP } from "express-graphql";
import { schema } from "./graphql/schema";
import authMiddleware from "./middleware/basic-auth";

app.use(Cors());
//app.use("/graphql", Cors(), authMiddleware);
app.use(require("morgan")(morganFormat, { stream }));
app.set("logger", logger);
app.use(express.static(path.join(process.cwd(), "public")));
app.use("/api/friends", Cors(), friendRoutes);

app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    graphiql: true,
  })
);

/* app.use("/graphql", (req, res, next) => {
  const body = req.body;

  if (body && body.query && body.query.includes("createFriend")) {
    console.log("Create");
    return next();
  }
  if (body && body.operationName && body.query.includes("IntrospectionQuery")) {
    return next();
  }
  if (body.query && (body.mutation || body.query)) {
    return authMiddleware(req, res, next);
  }
  next();
}); */

//404 handlers for api-requests
app.use("/api", (request: Request, response: Response, next: Function) => {
  response.status(404).json({ errorCode: 404, msg: "Path does not exist" });
});

app.use((error: any, request: Request, response: Response, next: Function) => {
  if (error instanceof ApiError) {
    if (error.errorCode != undefined)
      response
        .status(error.errorCode)
        .json({ errorCode: error.errorCode, msg: error.message });
  } else {
    next(error);
  }
});

export default app;
