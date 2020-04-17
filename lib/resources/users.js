const request = require("../utils/request-utilities");
const cheerio = require("cheerio");

module.exports = {
	getUser: async (username) => {
		const response = await request.get(`/tag/${username}`);
		return extractUser(response.body);
	},
};

extractUser = (html) => {
	const $ = cheerio.load(html, { decodeEntities: false });

	const userContainer = $("div.card.user-profile");
	const username = userContainer.find("div.card-header").text().split(" ")[0];

	const userInfoTable = userContainer.find("table.table");
	const premiumStatus = hasPremiumMembership(userInfoTable);
	const adsInfo = extractAdsInfo(userInfoTable);
	const reputation = extractReputation(userInfoTable);
	const gadgets = extractValueFromTable(userInfoTable, "Cuccok");
	const signature = extractValueFromTable(userInfoTable, "Aláírás");
	const comments = extractComments(userInfoTable);

	const accountCreated = extractAccountCreated(userInfoTable);
	const lastLogin = extractLastLogin(userInfoTable);

	return {
		username: username,
		hasPremiumMembership: premiumStatus,
		ads: adsInfo,
		reputation: reputation,
		gadgets: gadgets,
		signature: signature,
		comments: comments,
		accountCreated: accountCreated,
		lastLogin: lastLogin,
	};
};

extractValueFromTable = (table, property) => {
	const $ = cheerio.load(table, { decodeEntities: false });

	if (hasProperty(table, property)) {
		return $(table).find(`th:contains(${property})`).next().text().trim();
	} else {
		return "";
	}
};

hasProperty = (table, property) => {
	const $ = cheerio.load(table, { decodeEntities: false });

	return $(table).find(`th:contains(${property})`);
};

hasPremiumMembership = (table) => {
	const $ = cheerio.load(table, { decodeEntities: false });
	return $(table).find("tr:nth-child(1)").children().length == 1;
};

extractAdsInfo = (table) => {
	const numberOfAds = extractValueFromTable(table, "Hirdetések");

	let activeAds = 0;
	let frozenAds = 0;
	if (numberOfAds.includes("jegelt")) {
		numberOfAdsParts = numberOfAds.split(" és ").map((part) => part.trim());
		activeAds = parseInt(numberOfAdsParts[0].trim());
		frozenAds = parseInt(numberOfAdsParts[1].trim());
	} else if (!numberOfAds.includes("nincs")) {
		activeAds = parseInt(numberOfAds.substr(0, 2));
	}

	return { active: activeAds, frozen: frozenAds };
};

extractReputation = (table) => {
	const reputationString = extractValueFromTable(table, "Értékelések").replace(" és ", ", ").replace("nincs", "0");

	const positiveRatings = parseInt(reputationString.split(",")[0].trim());
	const negativeRatings = parseInt(reputationString.split(",")[1].trim());

	return { positive: positiveRatings, negative: negativeRatings };
};

extractComments = (table) => {
	const commentsArray = extractValueFromTable(table, "Hozzászólások")
		.split(",")
		.map((part) => part.trim());

	const technicalComments = parseInt(commentsArray[0]);
	const communityComments = parseInt(commentsArray[1]);
	const marketplaceCommets = parseInt(commentsArray[2]);
	const blogAndLocalComments = parseInt(commentsArray[3]);

	return { technical: technicalComments, community: communityComments, marketplace: marketplaceCommets, blogAndLocal: blogAndLocalComments };
};

extractAccountCreated = (table) => {
	const accountCreatedString = extractValueFromTable(table, "Regisztrált").split(",")[0].trim();
	const accountCreatedDate = new Date(accountCreatedString).toISOString();
	return accountCreatedDate;
};

extractLastLogin = (table) => {
	const lastLoginString = extractValueFromTable(table, "Utoljára belépve");
	const lastLoginDate = new Date(lastLoginString).toISOString();
	return lastLoginDate;
};
