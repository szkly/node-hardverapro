const request = require("../utils/request-utilities");
const cheerio = require("cheerio");

module.exports = {
  getAd: async (slug) => {
    const response = await request.get(request.endpoints.ADS, slug);
    return extractAd(response.body);
  },
};

extractAd = (html) => {
  const $ = cheerio.load(html, { decodeEntities: false });

  const title = extractTitleFromAd(html);
  const isFrozen = extractStatusFromAd(html);
  const images = extractImagesFromAd(html);

  const dateBlock = $(".uad-time-location");
  const datePosted = extractDatePostedFromAd(dateBlock);
  const lastBump = extractLastBumpFromAd(dateBlock);

  const locationsBlock = $("span.fa-map-marker").parent();
  const locations = extractLocationsFromAd(locationsBlock);

  const detailsBlock = $(".uad-details");
  const price = extractPriceFromAd(detailsBlock);

  const infoBlock = detailsBlock.children().last().find("tbody");
  const isUsed = extractConditionFromAd(infoBlock);
  const isUpForSale = extractIntentionFromAd(infoBlock);
  const brandInfo = extractBrandInfoFromAd(infoBlock);

  const descriptionAsHTML = extractDescriptionFromAd(html);

  const seller = extractSellerInfoFromAd(html);

  return {
    title: title,
    price: price,
    locations: locations,
    description: descriptionAsHTML,
    isFrozen: isFrozen,
    isUsed: isUsed,
    isUpForSale: isUpForSale,
    images: images,
    brand: brandInfo,
    seller: seller,
    datePosted: datePosted,
    lastBump: lastBump,
  };
};

extractTitleFromAd = (html) => {
  const $ = cheerio.load(html, { decodeEntities: false });

  return $(html).find("div.uad-content-block > h1").text().trim();
};

extractStatusFromAd = (html) => {
  const $ = cheerio.load(html, { decodeEntities: false });

  return $(html).find("div.iced").length !== 0;
};

extractImagesFromAd = (html) => {
  const $ = cheerio.load(html, { decodeEntities: false });

  let images = [];
  if (hasImages(html)) {
    const imageCarousel = $(html).find("div#uad-images-carousel");

    if (imageCarousel.children().length > 1) {
      imageCarousel.find("div.carousel-item > a").each((i, elem) => {
        const imgPath = $(elem).attr("href").split("/dl/uad")[1];
        images.push(imgPath);
      });
    } else {
      const imgPath = $(elem).find("div.carousel-item > a").attr("href").split("/dl/uad")[1];
      images.push(imgPath);
    }
  }

  return images;
};

hasImages = (html) => {
  const $ = cheerio.load(html, { decodeEntities: false });

  const featuredImageElement = $(html).find("div#uad-images-carousel > div.carousel-inner > div.active").find("img");
  const featuredImageSrc = featuredImageElement.attr("src");

  return !featuredImageSrc.includes("noimage");
};

extractDatePostedFromAd = (block) => {
  const $ = cheerio.load(block, { decodeEntities: false });

  const datePostedElement = $(block).find(`span[title="Feladás időpontja"]`);
  const datePostedString = datePostedElement.text().trim();
  const datePosted = new Date(datePostedString).toISOString();

  return datePosted;
};

extractLastBumpFromAd = (block) => {
  const $ = cheerio.load(block, { decodeEntities: false });

  const lastBumpElement = $(block).find(`span[title="Utolsó UP dátuma"]`);
  const lastBumpString = lastBumpElement.text().trim();
  const lastBumpAmount = parseInt(lastBumpString.split(" ")[0]);
  const lastBumpType = lastBumpString.split(" ")[1];

  let lastBumpDate = new Date();
  if (lastBumpType === "hónapja") {
    lastBumpDate = lastBumpDate.setMonth(lastBumpDate.getMonth() - lastBumpAmount);
  } else if (lastUpType === "napja") {
    lastBumpDate = lastBumpDate.setDate(lastBumpDate.getDate() - lastBumpAmount);
  } else if (lastUpType === "órája") {
    lastBumpDate = lastBumpDate.setHours(lastBumpDate.getHours() - lastBumpAmount);
  } else if (lastUpType === "perce") {
    lastBumpDate = lastBumpDate.setMinutes(lastBumpDate.getMinutes() - lastBumpAmount);
  } else {
    lastBumpDate = lastBumpDate.setSeconds(lastBumpDate.getSeconds() - lastBumpAmount);
  }

  const lastBump = new Date(lastBumpDate).toISOString();

  return lastBump;
};

extractLocationsFromAd = (block) => {
  const locationsString = block.text().trim();
  const locations = locationsString.includes(",") ? locationsString.split(",").map((location) => location.trim()) : [locationsString];

  return locations;
};

extractPriceFromAd = (block) => {
  const priceElement = block.children().first();
  const priceString = priceElement.text().trim();
  const priceInt = parseInt(priceString.slice(0, -2).replace(/ /g, ""));
  const price = Number.isInteger(priceInt) ? priceInt : priceString;

  return price;
};

extractConditionFromAd = (block) => {
  const conditionElement = block.find("tr:nth-child(1)").find("td");
  const conditionString = conditionElement.text().trim();
  const isUsed = conditionString === "használt";

  return isUsed;
};

extractIntentionFromAd = (block) => {
  const intentionElement = block.find("tr:nth-child(2)").find("td");
  const intentionString = intentionElement.text().trim();
  const isUpForSale = intentionString === "kínál";

  return isUpForSale;
};

extractBrandInfoFromAd = (block) => {
  let brandString = "";
  let brandId = 0;

  if (hasBrandInfo(block)) {
    const brandElement = block.find("tr:nth-child(3)").find("td");
    brandString = brandElement.find("a").text().trim();
    brandId = parseInt(brandElement.find("a").attr("href").split("=")[1]);
  }

  return { string: brandString, id: brandId };
};

hasBrandInfo = (block) => {
  return block.find("tr:nth-child(3)").find("td").length !== 0;
};

extractDescriptionFromAd = (html) => {
  const $ = cheerio.load(html, { decodeEntities: false });

  const descriptionBlock = $(".uad-content");
  const descriptionHTML = descriptionBlock.children().first().html().trim();

  return descriptionHTML;
};

extractSellerInfoFromAd = (html) => {
  const $ = cheerio.load(html, { decodeEntities: false });

  const sellerBlock = $(".uad-actions");
  const userElement = sellerBlock.find("span > b > a");
  const userSlug = userElement.attr("href").split("/")[2].split(".")[0];
  const username = userElement.text().trim();

  const { positiveRatings, negativeRatings } = extractReputationFromAd(sellerBlock);

  return { username: username, slug: userSlug, reputation: { positive: positiveRatings, negative: negativeRatings } };
};

extractReputationFromAd = (block) => {
  const $ = cheerio.load(block, { decodeEntities: false });

  const reputationElement = $(block).find("span > b > span");
  const reputationString = reputationElement.attr("title");

  const positiveRatings = isNaN(parseInt(reputationString.split(",")[0])) ? 0 : parseInt(reputationString.split(",")[0]);
  const negativeRatings = isNaN(parseInt(reputationString.split(",")[1])) ? 0 : parseInt(reputationString.split(",")[1]);

  return { positiveRatings, negativeRatings };
};
