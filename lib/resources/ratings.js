const request = require("../utils/request-utilities");
const cheerio = require("cheerio");

module.exports = {
	listRatings: async (authCookie) => {
		authCookie = `identifier=${authCookie}`;
		const response = await request.get("/ertekelesek/index.html", null, authCookie);
		return extractRatings(response.body);
	},

	listUserRatings: async (username) => {
		const response = await request.get(`/tag/${username}`);
		return extractUserRatings(response.body);
	},
};

extractRatings = (html) => {
	const $ = cheerio.load(html, { decodeEntities: false });

	const ratingsTableRows = $(html).find("table.table-responsive > tbody > tr");

	let ratings = [];
	ratingsTableRows.each((i, elem) => {
		const ad = extractAdInfo(elem);
		const seller = extractUserInfo(elem, 2);
		const buyer = extractUserInfo(elem, 3);
		const isClosed = extractState(elem);
		const modifiedAt = extractModifiedAt(elem);

		ratings.push({
			ad: ad,
			seller: seller,
			buyer: buyer,
			closed: isClosed,
			modifiedAt: modifiedAt,
		});
	});

	return ratings;
};

extractAdInfo = (tableRow) => {
	const $ = cheerio.load(tableRow, { decodeEntities: false });

	const linkAndTitleElement = $(tableRow).find("td:nth-child(1) > a");
	const title = linkAndTitleElement.text().trim();
	const slug = linkAndTitleElement.attr("href").split("/")[4];

	return { title, slug };
};

extractUserInfo = (tableRow, cellNumber) => {
	const $ = cheerio.load(tableRow, { decodeEntities: false });

	const sellerElement = $(tableRow).find(`td:nth-child(${cellNumber}) > a`);
	const username = sellerElement.text().trim();
	const slug = sellerElement.attr("href").split("/")[2].split(".")[0];

	return { username, slug };
};

extractState = (tableRow) => {
	const $ = cheerio.load(tableRow, { decodeEntities: false });

	const stateElement = $(tableRow).find("td:nth-child(4)");
	const stateString = stateElement.text().trim();

	return stateString === "lezárva";
};

extractModifiedAt = (tableRow) => {
	const $ = cheerio.load(tableRow, { decodeEntities: false });

	const modifiedAtElement = $(tableRow).find("td.cell-time");
	const modifiedAtString = modifiedAtElement.text().trim();
	const modifiedAt = new Date(modifiedAtString).toISOString();

	return modifiedAt;
};

extractUserRatings = (html) => {
	const $ = cheerio.load(html, { decodeEntities: false });

	const ratingsTab = $(html).find("div.card:nth-child(2) > div.card-body > div.tab-content");
	const asSellerList = ratingsTab.find("div#elado > div.msg-list > ul > li.media > div.card");
	const asBuyerList = ratingsTab.find("div#vevo > div.msg-list >  ul > li.media > div.card");

	let asSeller = [];
	asSellerList.each((i, elem) => {
		asSeller.push(extractIndividualRating(elem));
	});

	let asBuyer = [];
	asBuyerList.each((i, elem) => {
		asBuyer.push(extractIndividualRating(elem));
	});

	return { asSeller: asSeller, asBuyer: asBuyer };
};

extractIndividualRating = (li) => {
	const $ = cheerio.load(li, { decodeEntities: false });

	const datePostedElement = $(li).find("div.card-header > ul > li > time");
	const datePostedString = datePostedElement.text().trim();
	const datePosted = new Date(datePostedString).toISOString();

	const headerElement = $(li).find("div.card-header > div > span");

	const buyerElement = headerElement.find("a:nth-child(1)");
	const buyerUsername = buyerElement.text().trim();
	const buyerSlug = buyerElement.attr("href").split("/")[2].split(".")[0];

	const sellerElement = headerElement.find("a:nth-child(3)");
	const sellerUsername = sellerElement.text().trim();
	const sellerSlug = sellerElement.attr("href").split("/")[2].split(".")[0];

	const ratingTypeElement = headerElement.find("b");
	const rating = ratingTypeElement.text().trim();

	const ratingElement = $(li).find("div.card-body > div.media-body > div");

	const adInfoElement = ratingElement.find("p.mb-3").find(":nth-child(2)");
	const adTitle = adInfoElement.text().trim();
	let adSlug = "";
	if (adInfoElement.get(0).tagName === "a") {
		adSlug = adInfoElement.attr("href").split("/")[4];
	} else {
		adSlug = adInfoElement.children("a").attr("href").split("/")[4];
	}

	ratingElement.children().remove("img");
	ratingElement.children().remove("p.mb-3");
	const ratingBody = ratingElement.text().trim();

	return {
		ad: {
			title: adTitle,
			slug: adSlug,
		},
		datePosted: datePosted,
		rating: rating,
		body: ratingBody,
		buyer: {
			username: buyerUsername,
			slug: buyerSlug,
		},
		seller: {
			username: sellerUsername,
			slug: sellerSlug,
		},
	};
};
