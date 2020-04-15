const request = require("../utils/request-utilities");
const cheerio = require("cheerio");

module.exports = {
	listRatings: async (authCookie) => {
        authCookie = `identifier=${authCookie}`
        const response = await request.get("/ertekelesek/index.html", null, authCookie);
		return extractRatings(response.body);
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
