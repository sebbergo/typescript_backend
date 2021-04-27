import { json, Router } from "express";
import { any } from "joi";
const router = Router();
import { ApiError } from "../errors/errors";
import FriendFacade from "../facades/friendFacade";
const debug = require("debug")("friend-routes");

let facade: FriendFacade;

// Initialize facade using the database set on the application object
router.use(async (req, res, next) => {
  if (!facade) {
    const db = req.app.get("db");
    debug("Database used: " + req.app.get("db-type"));
    facade = new FriendFacade(db);
  }
  next();
});

// This does NOT require authentication in order to let new users create themself
router.post("/", async function (req, res, next) {
  try {
    let newFriend = req.body;
    const status = await facade.addFriend(newFriend);
    res.json({ status });
  } catch (err) {
    debug(err);
    if (err instanceof ApiError) {
      next(err);
    } else {
      next(new ApiError(err.message, 400));
    }
  }
});

// ALL ENDPOINTS BELOW REQUIRES AUTHENTICATION

import authMiddleware from "../middleware/basic-auth";
const USE_AUTHENTICATION = !process.env["SKIP_AUTHENTICATION"];

if (USE_AUTHENTICATION) {
  router.use(authMiddleware);
}

router.get("/all", async (req: any, res) => {
  const friends = await facade.getAllFriends();

  const friendsDTO = friends.map((friend) => {
    const { firstName, lastName, email } = friend;
    return { firstName, lastName, email };
  });
  res.json(friendsDTO);
});

/**
 * authenticated users can edit himself
 */

router.put("/editme", async function (req: any, res, next) {
  try {
    if (!USE_AUTHENTICATION) {
      throw new ApiError("This endpoint requires authentication", 500);
    }
    const email = req.credentials.userName; //GET THE USERS EMAIL FROM SOMEWHERE (req.params OR req.credentials.userName)
    const friend = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
    };

    facade.editFriend(email, friend);

    return res.json(friend);
  } catch (err) {
    debug(err);
    if (err instanceof ApiError) {
      return next(err);
    }
    next(new ApiError(err.message, 400));
  }
});

router.get("/me", async (req: any, res, next) => {
  try {
    if (!USE_AUTHENTICATION) {
      throw new ApiError("This endpoint requires authentication", 500);
    }
    const email = req.credentials.userName; //GET THE USERS EMAIL FROM SOMEWHERE (req.params OR req.credentials.userName)

    return res.json(email);
  } catch (err) {
    debug(err);
    if (err instanceof ApiError) {
      return next(err);
    }
    next(new ApiError(err.message, 400));
  }
});

//These endpoint requires admin rights

//An admin user can fetch everyone
router.delete("/delete/:email", async function (req: any, res, next) {
  try {
    if (USE_AUTHENTICATION && req.credentials.role !== "admin") {
      throw new ApiError("This endpoint requires you to be an admin", 500);
    }

    const email = req.params.email;
    await facade.deleteFriend(email);

    res.json(email);
  } catch (err) {
    debug(err);
    if (err instanceof ApiError) {
      return next(err);
    }
    next(new ApiError(err.message, 401));
  }
});

router.get("/find-user/:email", async (req: any, res, next) => {
  try {
    /* if (USE_AUTHENTICATION && req.credentials.role !== "admin") {
      throw new ApiError("Not Authorized", 401);
    } */

    const userId = req.params.email;

    const friend = await facade.getFriend(userId);

    if (friend == null) {
      throw new ApiError("user not found", 404);
    }

    const { firstName, lastName, email, role } = friend;
    const friendDTO = { firstName, lastName, email };

    res.json(friendDTO);
  } catch (err) {
    debug(err);
    if (err instanceof ApiError) {
      return next(err);
    }
    next(new ApiError(err.message, 400));
  }
});

//An admin user can edit everyone
router.put("/:email", async function (req: any, res, next) {
  try {
    if (USE_AUTHENTICATION && req.credentials.role !== "admin") {
      throw new ApiError("Not Authorized", 401);
    }
    const email = req.params.email; //GET THE USERS EMAIL FROM SOMEWHERE (req.params OR req.credentials.userName)
    const newFriend = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
    };

    facade.editFriend(email, newFriend);

    return res.json(newFriend);
  } catch (err) {
    debug(err);
    if (err instanceof ApiError) {
      return next(err);
    }
    next(new ApiError(err.message, 400));
  }
});

export default router;
