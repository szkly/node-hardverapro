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
	const { buyer, seller } = extractPartiesInfo(headerElement, asBuyer);

	const ratingElement = $(li).find("div.card-body > div.media-body > div");

	const ratingTypeElement = ratingElement.find("p.mb-3:nth-child(2)").find("span");
	const rating = ratingTypeElement.text().trim();

	const adInfoElement = ratingElement.find("p.mb-3:nth-child(1)").find(":nth-child(2)");
	const adTitle = adInfoElement.text().trim();
	const adSlug = adInfoElement.get(0).tagName === "a" ? adInfoElement.attr("href").split("/")[4] : "";

	// It's necessary to clean up the rating element before we extract the rating body
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
		buyer: buyer,
		seller: seller,
	};
};

extractDatePosted = (element) => {
	const $ = cheerio.load(element, { decodeEntities: false });

	const datePostedElement = $(element).find("div.card-header > ul > li > time");
	const datePostedString = datePostedElement.text().trim();
	const datePosted = new Date(datePostedString).toISOString();

	return datePosted;
};

extractPartiesInfo = (element, asBuyer) => {
	const buyerElement = asBuyer ? element.find("a:nth-child(2)") : element.find("a:nth-child(1)");
	const sellerElement = asBuyer ? element.find("a:nth-child(1)") : element.find("a:nth-child(2)");

	const buyerInfo = extractPartyInfo(buyerElement);
	const sellerInfo = extractPartyInfo(sellerElement);

	return { buyer: buyerInfo, seller: sellerInfo };
};

extractPartyInfo = (element) => {
	const partyUsername = element.text().trim();
	const partySlug = element.attr("href").split("/")[2].split(".")[0];

	return { username: partyUsername, slug: partySlug };
};
