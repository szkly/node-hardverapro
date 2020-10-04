const ads = require("../lib/resources/ads");

const slug = "hyperx_8gb_fury_ddr4_2400mhz";

let adDetails = {};
beforeAll(async () => {
  adDetails = await ads.getAd(slug);
});

test("getAd should return an object", () => {
  expect(typeof adDetails).toBe("object");
});

test("adDetails should have a 'title' property", () => {
  expect(adDetails).toHaveProperty("title");

  expect(typeof adDetails.title).toBe("string");
});

test("adDetails should have a 'price' property", () => {
  expect(adDetails).toHaveProperty("price");
});

test("adDetails should have a 'locations' property", () => {
  expect(adDetails).toHaveProperty("locations");

  expect(Array.isArray(adDetails.locations)).toBe(true);
  expect(adDetails.locations.length).toBeGreaterThan(0);
});

test("adDetails should have a 'description' property", () => {
  expect(adDetails).toHaveProperty("description");

  expect(typeof adDetails.title).toBe("string");
});

test("adDetails should have an 'isFrozen' property", () => {
  expect(adDetails).toHaveProperty("isFrozen");
});

test("adDetails should have an 'isUsed' property", () => {
  expect(adDetails).toHaveProperty("isUsed");
});

test("adDetails should have an 'isUpForSale' property", () => {
  expect(adDetails).toHaveProperty("isUpForSale");
});

test("adDetails should have an 'images' property", () => {
  expect(adDetails).toHaveProperty("images");

  expect(Array.isArray(adDetails.images)).toBe(true);
  expect(adDetails.images.length).toBeGreaterThan(0);
});

test("adDetails should have a 'brand' property", () => {
  expect(adDetails).toHaveProperty("brand");

  expect(typeof adDetails.brand).toBe("object");
  expect(Object.keys(adDetails.brand).length).toBe(2);

  expect(adDetails.brand.id).toBeGreaterThanOrEqual(0);
});

test("adDetails should have a 'seller' property", () => {
  expect(adDetails).toHaveProperty("seller");

  expect(typeof adDetails.seller).toBe("object");
  expect(Object.keys(adDetails.seller).length).toBe(3);

  expect(typeof adDetails.seller.reputation).toBe("object");
  expect(Object.keys(adDetails.seller.reputation).length).toBe(2);
  expect(adDetails.seller.reputation.positive).toBeGreaterThanOrEqual(0);
  expect(adDetails.seller.reputation.negative).toBeGreaterThanOrEqual(0);
});

test("adDetails should have a 'datePosted' property", () => {
  expect(adDetails).toHaveProperty("datePosted");

  expect(typeof adDetails.datePosted).toBe("string");
});

test("adDetails should have a 'lastBump' property", () => {
  expect(adDetails).toHaveProperty("lastBump");

  expect(typeof adDetails.datePosted).toBe("string");
});
