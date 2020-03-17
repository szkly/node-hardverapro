const request = require("../utils/request-utilities");
const cheerio = require("cheerio");

module.exports = {
	getAds: async keyword => {
		let response = await request.get(`/aprok/keres.php?stext=${keyword}`);

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
		const title = $(this)
			.find("h1 > a")
			.text();

		let priceText = $(this)
			.find(".uad-price")
			.text();
		const price = Number.isInteger(parseInt(priceText.slice(0, -2))) ? parseInt(priceText.slice(0, -2).replace(/ /g, "")) : priceText;

		const locationsElement = $(this).find(".uad-info > .uad-light");

		const locations =
			locationsElement.children("span").length != 0
				? locationsElement
						.children("span")
						.attr("title")
						.split(",")
						.map(location => location.trim())
				: locationsElement.text();

		const profileName = $(this)
			.find(".uad-misc > .uad-light > a")
			.text();

		const profileUrl = $(this)
			.find(".uad-misc > .uad-light > a")
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
