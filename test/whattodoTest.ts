const expect = require("chai").expect;
import app from "../playground/nockdemo/whattodo";
const request = require("supertest")(app);
import nock from "nock";

describe("What to do endpoint", function () {
  before(() => {
    nock("https://www.boredapi.com")
      .get("/api/activity")
      .reply(200, { activity: "drink a single beer" });
  });

  it("Should eventually provide 'drink a single beer'", async function () {
    const response = await request.get("/whattodo");
    expect(response.body.activity).to.be.equal("drink a single beer");
  });
});
