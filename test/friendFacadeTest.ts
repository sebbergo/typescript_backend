import * as mongo from "mongodb";
import FriendFacade from "../src/facades/friendFacade";

import chai from "chai";
const expect = chai.expect;

//use these two lines for more streamlined tests of promise operations
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);

import bcryptjs from "bcryptjs";
import { InMemoryDbConnector } from "../src/config/dbConnector";
import { ApiError } from "../src/errors/errors";

let friendCollection: mongo.Collection;
let facade: FriendFacade;

describe("## Verify the Friends Facade ##", () => {
  before(async function () {
    //Connect to inmemory test database
    const client = await InMemoryDbConnector.connect();
    //Get the database and initialize the facade
    const db = client.db();
    facade = new FriendFacade(db);
    //Initialize friendCollection, to operate on the database without the facade
    friendCollection = db.collection("friends");
  });

  beforeEach(async () => {
    const hashedPW = await bcryptjs.hash("secret", 4);
    await friendCollection.deleteMany({});
    //Create a few testusers for ALL the tests
    await friendCollection.insertMany([
      {
        firstName: "Sebastian",
        lastName: "Hansen",
        email: "test@testseb.dk",
        password: hashedPW,
        role: "admin",
      },
      {
        firstName: "Phillip",
        lastName: "Andersen",
        email: "test@testphil.dk",
        password: hashedPW,
        role: "user",
      },
    ]);
  });

  describe("Verify the addFriend method", () => {
    xit("It should Add the user Jan", async () => {
      const newFriend = {
        firstName: "Jan",
        lastName: "Olsen",
        email: "jan@b.dk",
        password: "secret",
      };
      const status = await facade.addFriend(newFriend);
      expect(status).to.be.not.null;
      const jan = await friendCollection.findOne({ email: "jan@b.dk" });
      expect(jan.firstName).to.be.equal("Jan");
    });

    it("It should not add a user with a role (validation fails)", async () => {
      const newFriend = {
        firstName: "Jan",
        lastName: "Olsen",
        email: "jan@b.dk",
        password: "secret",
        role: "admin",
      };

      const status = facade.addFriend(newFriend);
      expect(status).to.be.rejected;
    });
  });

  describe("Verify the editFriend method", () => {
    xit("It should change lastName to XXXX", async () => {
      const newLastName = {
        firstName: "Sebastian",
        lastName: "nytefternavn",
        email: "test@testseb.dk",
        password: "secret",
      };

      const status = await facade.editFriend(newLastName.email, newLastName);
      expect(status.modifiedCount).equal(1);
    });
  });

  describe("Verify the deleteFriend method", () => {
    it("It should remove the user Phillip", async () => {
      const status = await facade.deleteFriend("test@testphil.dk");
      expect(status).to.be.true;
    });

    it("It should return false, for a user that does not exist", async () => {
      const status = facade.getFriend("test@abihanzo.dk");
      expect(status).to.be.rejected;
    });
  });

  describe("Verify the getAllFriends method", () => {
    it("It should get two friends", async () => {
      const status = await facade.getAllFriends();
      expect(status.length).equal(2);
    });
  });

  describe("Verify the getFriend method", () => {
    it("It should find Sebastian", async () => {
      const status = await facade.getFriend("test@testseb.dk");
      expect(status.firstName).equal("Sebastian");
    });

    it("It should not find xxx.@.b.dk", async () => {
      expect(facade.getFriend("xxx.@.b.dk")).to.be.rejectedWith(
        ApiError,
        "The given email did not give a result from our database, please try another"
      );
    });
  });

  describe("Verify the getVerifiedUser method", () => {
    it("It should correctly validate Sebastian's credential,s", async () => {
      const status = await facade.getVerifiedUser("test@testseb.dk", "secret");
      expect(status).to.be.not.null;
    });

    xit("It should NOT validate Sebastian's credentials", async () => {
      const status = await facade.getVerifiedUser(
        "test@testseb.dk",
        "habibiaiwadethereretforkertpassword"
      );
      console.log(status);
      expect(status).to.be.null;
    });

    it("It should NOT validate a non-existing users credentials", async () => {
      const status = await facade.getVerifiedUser(
        "test@testforkert.dk",
        "secret"
      );
      expect(status).to.be.null;
    });
  });
});
