import FriendFacade from "../facades/friendFacade";
import { IFriend } from "../interfaces/IFriend";
import { ApiError } from "../errors/errors";
import { Request } from "express";
import fetch from "node-fetch";
import PositionFacade from "../facades/positionFacade";

let friendFacade: FriendFacade;
let positionFacade: PositionFacade;

/*
We don't have access to app or the Router so we need to set up the facade in another way
In www.ts IMPORT and CALL the method below, like so: 
      setupFacade(db);
Just before the line where you start the server
*/
export function setupFacade(db: any) {
  if (!friendFacade) {
    friendFacade = new FriendFacade(db);
  }

  if (!positionFacade) {
    positionFacade = new PositionFacade(db);
  }
}

interface IPositionInput {
  email: string;
  longitude: number;
  latitude: number;
}

interface IFindNearbyPlayers {
  email: string;
  latitude: number;
  longitude: number;
  distance: number;
}

// resolver map
export const resolvers = {
  Query: {
    allFriends: (root: any, _: any, req: any) => {
      /* if (!req.credentials.role || req.credentials.role !== "admin") {
        throw new ApiError("Not Authorized", 401);
      } */
      return friendFacade.getAllFriendsV2();
    },

    getAllFriendsProxy: async (root: object, _: any, req: Request) => {
      let options: any = { method: "GET" };

      //This part only required if authentication is required
      const auth = req.get("authorization");
      if (auth) {
        options.headers = { authorization: auth };
      }
      return fetch(
        `http://localhost:${process.env.PORT}/api/friends/all`,
        options
      ).then((r) => {
        if (r.status >= 400) {
          throw new Error(r.statusText);
        }
        return r.json();
      });
    },

    findFriend: async (_: object, { input }: { input: string }) => {
      return friendFacade.findFriend(input);
    },

    getAllPositions: async (root: any, _: any, req: any) => {
      return positionFacade.getAllPositions();
    },
  },
  Mutation: {
    createFriend: async (_: object, { input }: { input: IFriend }) => {
      return friendFacade.addFriend(input);
    },

    updateFriend: async (_: object, { input }: { input: IFriend }) => {
      return friendFacade.editFriendV2(input.email, input);
    },

    deleteFriend: async (_: object, { input }: { input: string }) => {
      return friendFacade.deleteFriend(input);
    },

    addOrUpdatePosition: async (
      _: object,
      { input }: { input: IPositionInput }
    ) => {
      try {
        positionFacade.addOrUpdatePosition(
          input.email,
          input.longitude,
          input.latitude
        );

        return true;
      } catch (error) {
        return false;
      }
    },

    findNearbyPlayers: async (
      _: object,
      { input }: { input: IFindNearbyPlayers }
    ) => {
      return positionFacade.findNearbyFriends(
        input.email,
        input.longitude,
        input.latitude,
        input.distance
      );
    },
  },
};
