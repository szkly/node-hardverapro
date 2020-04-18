const request = require("../utils/request-utilities");
const cheerio = require("cheerio");

module.exports = {
	searchAds: async (keyword) => {
		let response = await request.get(request.pathTypes.SEARCH, `?stext=${keyword}`);

		const lastOffset = getLastOffset(response.body);

		if (lastOffset != 0) {
            const path = `${request.pathTypes.SEARCH}?stext=${keyword}`
			return await bulkFetchAds(path, lastOffset);
		}

		return extractAds(response.body);
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

	const ads = adElements
		.map((i, elem) => {
			const title = extractTitleFromList(elem);
			const featuredImage = extractFeaturedImage(elem);
			const imageCount = extractImageCountFromList(elem);
			const price = extractPriceFromList(elem);
			const locations = extractLocationsFromList(elem);
			const seller = extractSellerInfoFromList(elem);

			return {
				title: title,
				featuredImage: featuredImage,
				imageCount: imageCount,
				price: price,
				locations: locations,
				seller: seller,
			};
		})
		.get();

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

extractImageCountFromList = (html) => {
	if (hasFeaturedImage(html)) {
		const $ = cheerio.load(html, { decodeEntities: true });

		const imageCountElement = $(html).find("a.uad-image > span.uad-photos");
		const imageCount = parseInt(imageCountElement.text().trim());

		return imageCount;
	}

	return 0;
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
