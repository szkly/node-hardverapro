const request = require("../utils/request-utilities");
const cheerio = require("cheerio");

module.exports = {
	listRatings: async (authCookie) => {
		const response = await request.get(request.endpoints.RATINGS, null, null, authCookie);

		return extractRatings(response.body);
	},

	listUserRatings: async (slug) => {
		const response = await request.get(request.endpoints.USERS, slug);

		return extractUserRatings(response.body);
	},
};

extractRatings = (html) => {
	const $ = cheerio.load(html, { decodeEntities: false });

	const ratingsTableRows = $(html).find("table.table-responsive > tbody > tr");

	const ratings = ratingsTableRows
		.map((i, elem) => {
			const ad = extractAdInfo(elem);
			const seller = extractUserInfo(elem, 2);
			const buyer = extractUserInfo(elem, 3);
			const isClosed = extractState(elem);
			const modifiedAt = extractModifiedAt(elem);

			return {
				ad: ad,
				seller: seller,
				buyer: buyer,
				closed: isClosed,
				modifiedAt: modifiedAt,
			};
		})
		.get();

	// TODO: Rating bodies

	return ratings;
};

extractAdInfo = (tableRow) => {
	const $ = cheerio.load(tableRow, { decodeEntities: false });

	let title = "";
	let slug = "";

	const cellDataElement = $(tableRow).find("td:nth-child(1) > :first-child");
	if (cellDataElement.get(0).tagName === "a") {
		title = cellDataElement.text().trim();
		slug = cellDataElement.attr("href").split("/")[4];
	}

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

	const asSeller = asSellerList
		.map((i, elem) => {
			return extractIndividualRating(elem, false);
		})
		.get();

	const asBuyer = asBuyerList
		.map((i, elem) => {
			return extractIndividualRating(elem, true);
		})
		.get();

	return { asSeller: asSeller, asBuyer: asBuyer };
};

extractIndividualRating = (li, asBuyer) => {
	const $ = cheerio.load(li, { decodeEntities: false });

	const datePosted = extractDatePosted(li);

	const headerElement = $(li).find("div.card-header > div > span");
	const buyerInfo = extractBuyerInfo(headerElement, asBuyer);
	const sellerInfo = extractSellerInfo(headerElement, asBuyer);

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
		buyer: buyerInfo,
		seller: sellerInfo,
	};
};

extractDatePosted = (html) => {
	const $ = cheerio.load(html, { decodeEntities: false });

	const datePostedElement = $(html).find("div.card-header > ul > li > time");
	const datePostedString = datePostedElement.text().trim();
	const datePosted = new Date(datePostedString).toISOString();

	return datePosted;
};

extractBuyerInfo = (element, asBuyer) => {
	const $ = cheerio.load(element, { decodeEntities: false });

	const buyerElement = asBuyer ? $(element).children("a:nth-child(3)") : $(element).children("a:nth-child(1)");
	const buyerUsername = buyerElement.text().trim();
	const buyerSlug = buyerElement.attr("href").split("/")[2].split(".")[0];

	return { username: buyerUsername, slug: buyerSlug };
};

extractSellerInfo = (element, asBuyer) => {
	const $ = cheerio.load(element, { decodeEntities: false });

	const sellerElement = asBuyer ? $(element).children("a:nth-child(1)") : $(element).children("a:nth-child(3)");
	const sellerUsername = sellerElement.text().trim();
	const sellerSlug = sellerElement.attr("href").split("/")[2].split(".")[0];

	return { username: sellerUsername, slug: sellerSlug };
};
