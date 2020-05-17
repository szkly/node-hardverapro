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

	const timeLocationBlock = $(".uad-time-location");
	const datePosted = extractDatePostedFromAd(timeLocationBlock);
	const lastUp = extractLastUpFromAd(timeLocationBlock);
	const locations = extractLocationsFromAd(timeLocationBlock);

	const detailsBlock = $(".uad-details");
	const price = extractPriceFromAd(detailsBlock);

	const infoBlock = detailsBlock.children().last().find("tbody");
	const isUsed = extractConditionFromAd(infoBlock);
	const isSelling = extractIntentionFromAd(infoBlock);
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
		isSelling: isSelling,
		images: images,
		brand: brandInfo,
		seller: seller,
		datePosted: datePosted,
		lastUp: lastUp,
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

extractLastUpFromAd = (block) => {
	const $ = cheerio.load(block, { decodeEntities: false });

	const lastUpElement = $(block).find(`span[title="Utolsó UP dátuma"]`);
	const lastUpString = lastUpElement.text().trim();
	const lastUpAmount = parseInt(lastUpString.split(" ")[0]);
	const lastUpType = lastUpString.split(" ")[1];

	let lastUpDate = new Date();
	if (lastUpType === "hónapja") {
		lastUpDate = lastUpDate.setMonth(lastUpDate.getMonth() - lastUpAmount);
	} else if (lastUpType === "napja") {
		lastUpDate = lastUpDate.setDate(lastUpDate.getDate() - lastUpAmount);
	} else if (lastUpType === "órája") {
		lastUpDate = lastUpDate.setHours(lastUpDate.getHours() - lastUpAmount);
	} else if (lastUpType === "perce") {
		lastUpDate = lastUpDate.setMinutes(lastUpDate.getMinutes() - lastUpAmount);
	} else {
		lastUpDate = lastUpDate.setSeconds(lastUpDate.getSeconds() - lastUpAmount);
	}

	const lastUp = new Date(lastUpDate).toISOString();

	return lastUp;
};

extractLocationsFromAd = (block) => {
	const $ = cheerio.load(block, { decodeEntities: false });

	const locationsElement = $(block).find(":nth-child(3)");
	const locationsString = locationsElement.text().trim();
	const locations = locationsString.includes(",") ? locationsString.split(",").map((location) => location.trim()) : [locationsString];

	return locations;
};

extractPriceFromAd = (block) => {
	const $ = cheerio.load(block, { decodeEntities: false });

	const priceElement = $(block).children().first();
	const priceString = priceElement.text().trim();
	const priceInt = parseInt(priceString.slice(0, -2).replace(/ /g, ""));
	const price = Number.isInteger(priceInt) ? priceInt : priceString;

	return price;
};

extractConditionFromAd = (block) => {
	const $ = cheerio.load(block, { decodeEntities: false });

	const conditionElement = $(block).find("tr:nth-child(1)").find("td");
	const conditionString = conditionElement.text().trim();
	const isUsed = conditionString === "használt";

	return isUsed;
};

extractIntentionFromAd = (block) => {
	const $ = cheerio.load(block, { decodeEntities: false });

	const intentionElement = $(block).find("tr:nth-child(2)").find("td");
	const intentionString = intentionElement.text().trim();
	const isSelling = intentionString === "kínál";

	return isSelling;
};

extractBrandInfoFromAd = (block) => {
	const $ = cheerio.load(block, { decodeEntities: false });

	let brandString = "";
	let brandId = 0;

	if (hasBrandInfo(block)) {
		const brandElement = $(block).find("tr:nth-child(3)").find("td");
		brandString = brandElement.find("a").text().trim();
		brandId = parseInt(brandElement.find("a").attr("href").split("=")[1]);
	}

	return { string: brandString, id: brandId };
};

hasBrandInfo = (block) => {
	const $ = cheerio.load(block, { decodeEntities: false });

	return $(block).find("tr:nth-child(3)").find("td").length !== 0;
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
	const positiveRatings = parseInt(reputationString.split(",")[0].trim());
	const negativeRatings = parseInt(reputationString.split(",")[1].trim());

	return { positiveRatings, negativeRatings };
};
