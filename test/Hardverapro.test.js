const Hardverapro = require("../lib/Hardverapro");

let ha;

beforeEach(() => {
  ha = new Hardverapro();
});

test("ha should be an instance of the Hardverapro class", () => {
  expect(ha).toBeInstanceOf(Hardverapro);
});

test("ha should have a login function", () => {
  expect(ha.login).toBeDefined();
});

test("ha should have a getMe function", () => {
  expect(ha.getMe).toBeDefined();
});

test("ha should have a getAd function", () => {
  expect(ha.getAd).toBeDefined();
});

test("ha should have a listMessageThreads function", () => {
  expect(ha.listMessageThreads).toBeDefined();
});

test("ha should have a listRatings function", () => {
  expect(ha.listRatings).toBeDefined();
});

test("ha should have a listUserRatings function", () => {
  expect(ha.listUserRatings).toBeDefined();
});

test("ha should have a searchAds function", () => {
  expect(ha.searchAds).toBeDefined();
});

test("ha should have a searchSellers function", () => {
  expect(ha.searchSellers).toBeDefined();
});

test("ha should have a getUser function", () => {
  expect(ha.getUser).toBeDefined();
});
