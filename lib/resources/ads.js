const request = require("../utils/request-utilities");
const cheerio = require("cheerio");

module.exports = {
	listAds: async (keyword) => {
		let path = `/aprok/keres.php?stext=${keyword}`;
		let response = await request.get(path);

		const lastOffset = getLastOffset(response.body);

		if (lastOffset != 0) {
			return await bulkFetchAds(path, lastOffset);
		}

		return extractAds(response.body);
	},

	getAd: async (slug) => {
		const response = await request.get(`/apro/${slug}`);
		return extractAd(response.body);
	},
};

bulkFetchAds = async (path, lastOffset) => {
	let requests = [];
	for (let i = 0; i <= lastOffset; i += 200) {
		requests.push(fetchAds(path, i));
	}

	return Promise.all(requests)
		.then((ads) => {
			ads = ads.flat();
			return ads;
		})
		.catch((err) => console.error(err));
};

isLastPage = (html) => {
	const $ = cheerio.load(html, { decodeEntities: true });
	const nextPageButton = $("span.fa-forward");

	return nextPageButton.parent("a").hasClass("disabled");
};

getLastOffset = (html) => {
	const $ = cheerio.load(html, { decodeEntities: true });
	const lastPageButton = $("span.fa-fast-forward");

	if (!isLastPage(html)) {
		return parseInt(lastPageButton.parent("a").attr("href").split("=")[2]);
	}
	return 0;
};

fetchAds = async (path, offset) => {
	const response = await request.get(`${path}&offset=${offset}`);
	return extractAds(response.body);
};

extractAds = (html) => {
	const $ = cheerio.load(html, { decodeEntities: false });

	const adElements = $("li.media").not("li.media[onClick]");

	let ads = [];
	adElements.each(function (i, elem) {
		const title = extractTitleFromList(elem);
		const featuredImage = extractFeaturedImage(elem);
		const price = extractPriceFromList(elem);
		const locations = extractLocationsFromList(elem);
		const seller = extractSellerInfoFromList(elem);

		ads.push({
			title: title,
			featuredImage: featuredImage,
			price: price,
			locations: locations,
			seller: seller,
		});
	});

	return ads;
};

extractTitleFromList = (html) => {
	const $ = cheerio.load(html, { decodeEntities: true });

	return $(html).find("h1 > a").text().trim();
};

extractFeaturedImage = (html) => {
	const $ = cheerio.load(html, { decodeEntities: true });

	if (hasFeaturedImage(html)) {
		const rawImgPath = $(html).find("a.uad-image > img.d-block.d-md-none").attr("src");

		const filename = rawImgPath.split(".")[0].split("/dl/uad")[1];
		let ext = rawImgPath.split(".")[1] === "500" ? rawImgPath.split(".")[2] : rawImgPath.split(".")[1];

		return `${filename}.${ext}`;
	}

	return "";
};

hasFeaturedImage = (html) => {
	const $ = cheerio.load(html, { decodeEntities: true });

	const rawImgPath = $(html).find("a.uad-image > img.d-block.d-md-none").attr("src");

	return !rawImgPath.includes("noimage");
};

extractPriceFromList = (html) => {
	const $ = cheerio.load(html, { decodeEntities: true });

	const priceString = $(".uad-price").text().trim();
	const priceInt = parseInt(priceString.slice(0, -2).replace(/ /g, ""));
	const price = Number.isInteger(priceInt) ? priceInt : priceString;

	return price;
};

extractLocationsFromList = (html) => {
	const $ = cheerio.load(html, { decodeEntities: true });

	const infoContainer = $(html).find(".uad-info");
	const locationsElement = $(infoContainer).find(".uad-light");
	const locations =
		locationsElement.children("span").length != 0
			? locationsElement
					.children("span")
					.attr("title")
					.split(",")
					.map((location) => location.trim())
			: locationsElement.text();

	return locations;
};

extractSellerInfoFromList = (html) => {
	const $ = cheerio.load(html, { decodeEntities: true });

	const miscContainer = $(html).find(".uad-misc");
	const username = $(miscContainer).find(".uad-light > a").text();
	const userSlug = $(miscContainer).find(".uad-light > a").attr("href").split("/")[2].split(".")[0];

	const { positiveRatings, negativeRatings } = extractReputationFromList(html);

	return { username: username, slug: userSlug, reputation: { positive: positiveRatings, negative: negativeRatings } };
};

extractReputationFromList = (html) => {
	const $ = cheerio.load(html, { decodeEntities: true });

	const reputation = $(html).find(".uad-rating").attr("title");
	const positiveRatings = parseInt(reputation.split(",")[0].trim());
	const negativeRatings = parseInt(reputation.split(",")[1].trim());

	return { positiveRatings, negativeRatings };
};

extractAd = (html) => {
	const $ = cheerio.load(html, { decodeEntities: false });

	const title = extractTitleFromAd(html);
	const images = extractImagesFromAd(html);

	const timeLocationBlock = $(".uad-time-location");
	const datePosted = extractDatePostedFromAd(timeLocationBlock);
	const lastUpString = extractLastUpFromAd(timeLocationBlock);
	const locations = extractLocationsFromAd(timeLocationBlock);

	const detailsBlock = $(".uad-details");
	const price = extractPriceFromAd(detailsBlock);

	const infoBlock = detailsBlock.children().last().find("tbody");
	const isUsed = extractConditionFromAd(infoBlock);
	// TODO: Add "szándék"
	const { brandString, brandId } = extractBrandInfoFromAd(infoBlock);

	const descriptionAsHTML = extractDescriptionFromAd(html);

	const seller = extractSellerInfoFromAd(html);

	return {
		title: title,
		images: images,
		datePosted: datePosted,
		lastUp: lastUpString,
		locations: locations,
		price: price,
		isUsed: isUsed,
		brand: {
			string: brandString,
			id: brandId,
		},
		description: descriptionAsHTML,
		seller: seller,
	};
};

extractTitleFromAd = (html) => {
	const $ = cheerio.load(html, { decodeEntities: false });

	return $(html).find("div.uad-content-block > h1").text().trim();
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

	const featuredImageElement = $(html).find("div#uad-images-carousel > div.carousel-inner > div.active > a");
	const featuredImageSrc = featuredImageElement.attr("href");

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
	return lastUpString;
};

extractLocationsFromAd = (block) => {
	const $ = cheerio.load(block, { decodeEntities: false });

	const locationsString = $(block).find(":nth-child(3)").text().trim();
	const locations = locationsString.includes(",") ? locationsString.split(",").map((location) => location.trim()) : locationsString;

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

extractBrandInfoFromAd = (block) => {
	const $ = cheerio.load(block, { decodeEntities: false });

	let brandString = "";
	let brandId = 0;

	if (hasBrandInfo(block)) {
		const brandElement = $(block).find("tr:nth-child(3)").find("td");
		brandString = brandElement.find("a").text().trim();
		brandId = parseInt(brandElement.find("a").attr("href").split("=")[1]);
	}

	return { brandString, brandId };
};

hasBrandInfo = (block) => {
	const $ = cheerio.load(block, { decodeEntities: false });

	return $(block).find("tr:nth-child(3)").find("td").length !== 0;
};

extractDescriptionFromAd = (html) => {
	const $ = cheerio.load(html, { decodeEntities: false });

	const descriptionBlock = $(".uad-content");
	const descriptionAsHTML = descriptionBlock.children().first().html();

	return descriptionAsHTML;
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
