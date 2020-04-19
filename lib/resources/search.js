const request = require("../utils/request-utilities");
const cheerio = require("cheerio");

module.exports = {
	searchAds: async (query) => {
		const qs = {
			stext: query.keyword || "",
			county: query.county || "",
			settlement: query.settlement || "",
			minprice: query.minPrice || "",
			maxprice: query.maxPrice || "",
			company: query.brand || "",
			selling: query.isSelling === false ? 0 : 1,
			buying: query.isBuying === false ? 0 : 1,
			stext_none: query.excludedWords || "",
		};

		const response = await request.get(request.endpoints.SEARCH, null, qs);
		const lastOffset = getLastOffset(response.body);

		if (lastOffset != 0) {
			return await bulkFetchAds(request.endpoints.SEARCH, qs, lastOffset);
		}

		return extractAds(response.body);
	},
};

bulkFetchAds = async (endpoint, qs, lastOffset) => {
	let requests = [];
	for (let i = 0; i <= lastOffset; i += 200) {
		qs.offset = i;
		requests.push(fetchAds(endpoint, qs));
	}

	return Promise.all(requests)
		.then((ads) => {
			ads = ads.flat();
			return ads;
		})
		.catch((err) => console.error(err));
};

fetchAds = async (endpoint, qs) => {
	const response = await request.get(endpoint, null, qs);
	return extractAds(response.body);
};

getLastOffset = (html) => {
	const $ = cheerio.load(html, { decodeEntities: true });
	const lastPageButton = $("span.fa-fast-forward");

	if (!isLastPage(html)) {
		const lastOffsetElement = lastPageButton.parent("a");
		const lastOffsetString = lastOffsetElement.attr("href").split("offset=")[1];
		const lastOffset = parseInt(lastOffsetString);
		return lastOffset;
	}
	return 0;
};

isLastPage = (html) => {
	const $ = cheerio.load(html, { decodeEntities: true });
	const lastPageButton = $("span.fa-forward");

	return lastPageButton.parent("a").hasClass("disabled");
};

extractAds = (html) => {
	const $ = cheerio.load(html, { decodeEntities: false });

	const adElements = $("li.media").not("li.media[onClick]");

	const ads = adElements
		.map((i, elem) => {
			const ad = extractAdInfoFromSearch(elem);
			const featuredImage = extractFeaturedImageFromSearch(elem);
			const imageCount = extractImageCountFromSearch(elem);
			const price = extractPriceFromSearch(elem);
			const locations = extractLocationsFromSearch(elem);
			const seller = extractSellerInfoFromSearch(elem);

			return {
				ad: ad,
				price: price,
                locations: locations,
                image: {
                    featured: featuredImage,
                    count: imageCount
                },
				seller: seller,
			};
		})
		.get();

	return ads;
};

extractAdInfoFromSearch = (html) => {
	const $ = cheerio.load(html, { decodeEntities: true });

	const adInfoElement = $(html).find("h1 > a");
	const adTitle = adInfoElement.text().trim();
	const adSlug = adInfoElement.attr("href").split("/")[4];

	return { title: adTitle, slug: adSlug };
};

extractFeaturedImageFromSearch = (html) => {
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

extractImageCountFromSearch = (html) => {
	if (hasFeaturedImage(html)) {
		const $ = cheerio.load(html, { decodeEntities: true });

		const imageCountElement = $(html).find("a.uad-image > span.uad-photos");
		const imageCount = parseInt(imageCountElement.text().trim());

		return imageCount;
	}

	return 0;
};

extractPriceFromSearch = (html) => {
	const $ = cheerio.load(html, { decodeEntities: true });

	const priceString = $(".uad-price").text().trim();
	const priceInt = parseInt(priceString.slice(0, -2).replace(/ /g, ""));
	const price = Number.isInteger(priceInt) ? priceInt : priceString;

	return price;
};

extractLocationsFromSearch = (html) => {
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

extractSellerInfoFromSearch = (html) => {
	const $ = cheerio.load(html, { decodeEntities: true });

	const miscContainer = $(html).find(".uad-misc");
	const username = $(miscContainer).find(".uad-light > a").text();
	const userSlug = $(miscContainer).find(".uad-light > a").attr("href").split("/")[2].split(".")[0];

	const { positiveRatings, negativeRatings } = extractReputationFromSearch(html);

	return { username: username, slug: userSlug, reputation: { positive: positiveRatings, negative: negativeRatings } };
};

extractReputationFromSearch = (html) => {
	const $ = cheerio.load(html, { decodeEntities: true });

	const reputation = $(html).find(".uad-rating").attr("title");
	const positiveRatings = parseInt(reputation.split(",")[0].trim());
	const negativeRatings = parseInt(reputation.split(",")[1].trim());

	return { positiveRatings, negativeRatings };
};
