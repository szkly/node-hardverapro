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

fetchAds = async (path, offset) => {
	const response = await request.get(`${path}&offset=${offset}`);
	return extractAds(response.body);
};

extractAds = (html) => {
	const $ = cheerio.load(html, { decodeEntities: false });

	const adElements = $("li.media").not("li.media[onClick]");

	let ads = [];
	adElements.each(function (i, elem) {
		const title = $(this).find("h1 > a").text();

		const priceText = $(this).find(".uad-price").text();
		const priceInt = parseInt(priceText.slice(0, -2).replace(/ /g, ""));
		const price = Number.isInteger(priceInt) ? priceInt : priceText;

		const infoContainer = $(this).find(".uad-info");
		const locationsElement = $(infoContainer).find(".uad-light");
		const locations =
			locationsElement.children("span").length != 0
				? locationsElement
						.children("span")
						.attr("title")
						.split(",")
						.map((location) => location.trim())
				: locationsElement.text();

		const miscContainer = $(this).find(".uad-misc");
		const username = $(miscContainer).find(".uad-light > a").text();

		const userUrl = $(miscContainer).find(".uad-light > a").attr("href");

		const reputation = $(this).find(".uad-rating").attr("title");
		const positiveRatings = parseInt(reputation.split(",")[0].trim());
		const negativeRatings = parseInt(reputation.split(",")[1].trim());

		ads.push({
			title: title,
			price: price,
			locations: locations,
			seller: {
				name: username,
				url: userUrl,
			},
			reputation: {
				positive: positiveRatings,
				negative: negativeRatings,
			},
		});
	});

	return ads;
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

extractAd = (html) => {
	const $ = cheerio.load(html, { decodeEntities: false });

	const title = $("div.uad-content-block > h1").text().trim();

	const timeLocationBlock = $(".uad-time-location");
	const datePosted = extractDatePosted(timeLocationBlock);
	const lastUpString = extractLastUp(timeLocationBlock);
	const locations = extractLocations(timeLocationBlock);

	const detailsBlock = $(".uad-details");
	const price = extractPrice(detailsBlock);

	const infoBlock = detailsBlock.children().last().find("tbody");
	const isUsed = extractCondition(infoBlock);
	// TODO: Add "szándék"
	// TODO: brandId
	const brandString = extractBrand(infoBlock);

	const descriptionAsHTML = extractDescription(html);

	const sellerBlock = $(".uad-actions");
	const { userUrl, username } = extractSellerInfo(sellerBlock);
	const { positiveRatings, negativeRatings } = extractReputationInfo(sellerBlock);

	return {
		title: title,
		datePosted: datePosted,
		lastUp: lastUpString,
		locations: locations,
		price: price,
		isUsed: isUsed,
		brand: brandString,
		description: descriptionAsHTML,
		seller: {
			userUrl: userUrl,
			username: username,
		},
		reputation: {
			positive: positiveRatings,
			negative: negativeRatings,
		},
	};
};

extractDatePosted = (block) => {
	const $ = cheerio.load(block, { decodeEntities: false });

	const datePostedElement = $(block).find(`span[title="Feladás időpontja"]`);
	const datePostedString = datePostedElement.text().trim();
	const datePosted = new Date(datePostedString).toISOString();

	return datePosted;
};

extractLastUp = (block) => {
	const $ = cheerio.load(block, { decodeEntities: false });

	const lastUpElement = $(block).find(`span[title="Utolsó UP dátuma"]`);
	const lastUpString = lastUpElement.text().trim();
	return lastUpString;
};

extractLocations = (block) => {
	const $ = cheerio.load(block, { decodeEntities: false });

	const locationsString = $(block).find(":nth-child(3)").text().trim();
	const locations = locationsString.includes(",") ? locationsString.split(",").map((location) => location.trim()) : locationsString;

	return locations;
};

extractPrice = (block) => {
	const $ = cheerio.load(block, { decodeEntities: false });

	const priceElement = $(block).children().first();
	const priceString = priceElement.text();
	const priceInt = parseInt(priceString.slice(0, -2).replace(/ /g, ""));
	const price = Number.isInteger(priceInt) ? priceInt : priceString;

	return price;
};

extractCondition = (block) => {
	const $ = cheerio.load(block, { decodeEntities: false });

	const conditionElement = $(block).find("tr:nth-child(1)").find("td");
	const conditionString = conditionElement.text().trim();
	const isUsed = conditionString === "használt";

	return isUsed;
};

extractBrand = (block) => {
	const $ = cheerio.load(block, { decodeEntities: false });

	const brandElement = $(block).find("tr:nth-child(3)").find("td");
	const brandId = parseInt(brandElement.find("a").attr("href").split("=")[1]);
	const brandString = brandElement.find("a").text().trim();

	return brandString;
};

extractDescription = (html) => {
	const $ = cheerio.load(html, { decodeEntities: false });

	const descriptionBlock = $(".uad-content");
	const descriptionAsHTML = descriptionBlock.children().first().html();

	return descriptionAsHTML;
};

extractSellerInfo = (block) => {
	const $ = cheerio.load(block, { decodeEntities: false });

	const userElement = $(block).find("span > b > a");
	const userUrl = userElement.attr("href");
	const username = userElement.text().trim();

	const user = { userUrl, username };

	return user;
};

extractReputationInfo = (block) => {
	const $ = cheerio.load(block, { decodeEntities: false });

	const reputationElement = $(block).find("span > b > span");
	const reputationString = reputationElement.attr("title");
	const positiveRatings = parseInt(reputationString.split(",")[0].trim());
	const negativeRatings = parseInt(reputationString.split(",")[1].trim());

	return { positiveRatings, negativeRatings };
};
