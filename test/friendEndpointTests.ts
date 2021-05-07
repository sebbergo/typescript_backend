import path from "path";
import { expect } from "chai";
import app from "../src/app";

import supertest from "supertest";
const request = supertest(app);

import bcryptjs, { setRandomFallback } from "bcryptjs";
import * as mongo from "mongodb";
import { InMemoryDbConnector } from "../src/config/dbConnector";
let friendCollection: mongo.Collection;

describe("### Describe the Friend Endpoints (/api/friends) ###", function () {
  let URL: string;

  before(async function () {
    //Connect to IN-MEMORY test database
    const client = await InMemoryDbConnector.connect();
    //Get the database and set it on the app-object to make it availabe for the friendRoutes
    const db = client.db();
    app.set("db", db);
    //(See bin/www.ts if you are in doubt relateded to the part above)
    //Initialize friendCollection, to operate on the database without the facade
    friendCollection = db.collection("friends");
  });

  beforeEach(async function () {
    const hashedPW = await bcryptjs.hash("secret", 8);
    await friendCollection.deleteMany({});
    //Last friend below is only necessary if you have added authentications
    await friendCollection.insertMany([
      {
        firstName: "Peter",
        lastName: "Pan",
        email: "pp@b.dk",
        password: hashedPW,
        role: "user",
      },
      {
        firstName: "Donald",
        lastName: "Duck",
        email: "dd@b.dk",
        password: hashedPW,
        role: "user",
      },
      {
        firstName: "Ad",
        lastName: "Admin",
        email: "aa@a.dk",
        password: hashedPW,
        role: "admin",
      },
    ]);
  });

  //In this, and all the following REMOVE tests that requires authentication if you are using the simple version of friendRoutes
  describe("While attempting to get all users", function () {
    it("it should get two users when authenticated", async () => {
      const response = await request
        .get("/api/friends/all")
        .auth("pp@b.dk", "secret");
      expect(response.status).to.equal(200);
      expect(response.body.length).to.equal(3);
    });

    it("it should get a 401 when NOT authenticated", async () => {
      const response = await request.get("/api/friends/all");
      expect(response.status).to.equal(401);
    });
  });

  describe("While attempting to add a user", function () {
    xit("it should Add the user Jan Olsen", async () => {
      const newFriend = {
        firstName: "Jan",
        lastName: "Olsen",
        email: "jan@b.dk",
        password: "secret",
      };
      const response = await request.post("/api/friends").send(newFriend);
      expect(response.status).to.equal(200);
      expect(response.body.id).to.be.not.null;
    });

    it("It should fail to Add user due to wrong password length", async () => {
      const newFriend = {
        firstName: "Jan",
        lastName: "Olsen",
        email: "jan@b.dk",
        password: "sec",
      };
      const response = await request.post("/api/friends").send(newFriend);
      expect(response.status).to.equal(400);
    });
  });
  describe("While logged in as a user", function () {
    it("It should return the logged in user", async () => {
      const response = await request
        .get("/api/friends/me")
        .auth("pp@b.dk", "secret");
      expect(response.status).equal(200);
      expect(response.body).equal("pp@b.dk");
    });

    it("It should edit the logged in user", async () => {
      const editedFriend = {
        firstName: "Seb",
        lastName: "Kabeb",
        email: "pp@b.dk",
        role: "user",
      };
      const response = await request
        .put("/api/friends/editme")
        .auth("pp@b.dk", "secret")
        .send(editedFriend);
      expect(response.body.firstName).equals("Seb");
    });
  });

  describe("While verifying the get any user, given a userId (email)", function () {
    it("It should allow an admin user to find Donald Duck", async () => {
      const response = await request
        .get("/api/friends/find-user/pp@b.dk")
        .auth("aa@a.dk", "secret");
      expect(response.body.firstName).equals("Peter");
    });

    xit("It should not allow admin-users to find a non-existing user", async () => {
      const response = await request
        .get("/api/friends/find-user/fake@email.dk")
        .auth("aa@a.dk", "secret");
      expect(response.status).equals(400);
    });

    xit("It should not let a non-admin user find Donald Duck", async () => {
      const response = await request
        .get("/api/friends/find-user/dd@b.dk")
        .auth("pp@b.dk", "secret");
      expect(response.status).equals(401);
    });
  });

  describe("While verifying the 'edit any user', given a userId (email)", function () {
    it("It should allow an admin-user to edit Peter Pan", async () => {
      const editedFriend = {
        firstName: "Seb",
        lastName: "Kabeb",
        email: "pp@b.dk",
        role: "user",
      };

      const response = await request
        .put("/api/friends/pp@b.dk")
        .auth("aa@a.dk", "secret")
        .send(editedFriend);
      expect(response.status).equals(200);
    });

    it("It should NOT allow a non-admin user to edit Peter Pan", async () => {
      const editedFriend = {
        firstName: "Seb",
        lastName: "Kabeb",
        email: "pp@b.dk",
        role: "user",
      };

      const response = await request
        .put("/api/friends/pp@b.dk")
        .auth("dd@b.dk", "secret")
        .send(editedFriend);
      expect(response.status).equals(401);
    });
  });

  describe("While verifying the delete any user, given a userId (email)", function () {
    it("It should allow an admin user to delete Donald Duck", async () => {
      const response = await request
        .delete("/api/friends/delete/dd@b.dk")
        .auth("aa@a.dk", "secret");
      expect(response.status).equals(200);
    });

    it("It should NOT allow a non-admin user to delete Donald Duck", async () => {
      const response = await request
        .delete("/api/friends/delete/dd@b.dk")
        .auth("pp@b.dk", "secret");
      expect(response.status).equals(500);
    });
  });
});
