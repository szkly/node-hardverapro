const request = require("../utils/request-utilities");
const cheerio = require("cheerio");

module.exports = {
	getAds: async keyword => {
		let path = `/aprok/keres.php?stext=${keyword}`;
		let response = await request.get(path);

		let ads = extractAds(response.body);

		while (!isLastPage(response.body)) {
			path = getNextPageUrl(response.body);
			response = await request.get(path);
			ads.push(extractAds(response.body));
		}

		return ads.flat();
	}
};

extractAds = html => {
	const $ = cheerio.load(html, { decodeEntities: true });

	const adElements = $("li.media").not("li.media[onClick]");

	let ads = [];
	adElements.each(function(i, elem) {
		const infoContainer = adElements.find(".uad-info");
		const miscContainer = adElements.find(".uad-misc");

		const title = $(this)
			.find("h1 > a")
			.text();

		const priceText = $(this)
			.find(".uad-price")
			.text();
		const priceInt = parseInt(priceText.slice(0, -2).replace(/ /g, ""));
		const price = Number.isInteger(priceInt) ? priceInt : priceText;

		const locationsElement = $(infoContainer).find(".uad-light");

		const locations =
			locationsElement.children("span").length != 0
				? locationsElement
						.children("span")
						.attr("title")
						.split(",")
						.map(location => location.trim())
				: locationsElement.text();

		const profileName = $(miscContainer)
			.find(".uad-light > a")
			.text();

		const profileUrl = $(miscContainer)
			.find(".uad-light > a")
			.attr("href");

		const ratings = $(this)
			.find(".uad-rating")
			.attr("title");

		const positiveRatings = parseInt(
			ratings
				.split(",")[0]
				.substr(0, ratings.split(",")[0].indexOf("p"))
				.trim()
		);
		const negativeRatings = parseInt(
			ratings
				.split(",")[1]
				.substr(0, ratings.split(",")[1].indexOf("n"))
				.trim()
		);

		ads.push({
			title: title,
			price: price,
			locations: locations,
			profile: {
				name: profileName,
				url: profileUrl
			},
			ratings: {
				positive: positiveRatings,
				negative: negativeRatings
			}
		});
	});

	return ads;
};

isLastPage = html => {
	const $ = cheerio.load(html, { decodeEntities: true });
	const nextPageButton = $("span.fa-forward");

	return nextPageButton.parent("a").hasClass("disabled");
};

getNextPageUrl = html => {
	const $ = cheerio.load(html, { decodeEntities: true });
	const nextPageButton = $("span.fa-forward");

	return nextPageButton.parent("a").attr("href");
};
