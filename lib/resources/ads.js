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

	getAd: async (path) => {
		const response = await request.get(path);
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

getNextPageUrl = (html) => {
	const $ = cheerio.load(html, { decodeEntities: true });
	const nextPageButton = $("span.fa-forward");

	return nextPageButton.parent("a").attr("href");
};

extractAd = (html) => {
	const $ = cheerio.load(html, { decodeEntities: false });

	const title = $("div.uad-content-block > h1").text().trim();

	// Time & locations block
	const timeLocationBlock = $(".uad-time-location");

	const datePostedElement = $(timeLocationBlock).find(`span[title="Feladás időpontja"]`);
	const datePostedString = datePostedElement.text().trim();
	const datePosted = new Date(datePostedString).toISOString();

	const lastUpElement = $(timeLocationBlock).find(`span[title="Utolsó UP dátuma"]`);
	const lastUpString = lastUpElement.text().trim();

	const locationsString = $(timeLocationBlock).find(":nth-child(3)").text().trim();
	const locations = locationsString.includes(",") ? locationsString.split(",").map((location) => location.trim()) : locationsString;

	const detailsBlock = $(".uad-details");

	// #center > div.uad > div.row.no-gutters.uad-details > div:nth-child(1) > h2
	const priceElement = detailsBlock.children().first();
	const priceString = priceElement.text();
	const priceInt = parseInt(priceString.slice(0, -2).replace(/ /g, ""));
	const price = Number.isInteger(priceInt) ? priceInt : priceString;

	// #center > div.uad > div.row.no-gutters.uad-details > div:nth-child(3) > table > tbody
	const infoBlock = detailsBlock.children().last().find("tbody");

	const stateElement = infoBlock.find("tr:nth-child(1)").find("td");
	const stateString = stateElement.text().trim();
	const isUsed = stateString === "használt";

	//TODO: Add szándék

	const brandElement = infoBlock.find("tr:nth-child(3)").find("td");
	const brandString = brandElement.text().trim();

	const descriptionBlock = $(".uad-content");
	const descriptionAsHTML = descriptionBlock.children().first().html();

	const sellerBlock = $(".uad-actions");

	const userElement = sellerBlock.find("span > b > a");
	const userUrl = userElement.attr("href");
	const username = userElement.text().trim();

	const reputationElement = sellerBlock.find("span > b > span");
	const reputationString = reputationElement.attr("title");
	const positiveRatings = parseInt(reputationString.split(",")[0].trim());
	const negativeRatings = parseInt(reputationString.split(",")[1].trim());

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
			url: userUrl,
			username: username,
		},
		reputation: {
			positiveRatings: positiveRatings,
			negativeRatings: negativeRatings,
		},
	};
};
