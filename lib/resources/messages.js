const request = require("../utils/request-utilities");
const cheerio = require("cheerio");

module.exports = {
	listMessageThreads: async (authCookie) => {
		const response = await request.get(request.endpoints.PRIVATE_MESSAGES, null, null, authCookie);

		return await extractMessageThreads(response.body);
	},
};

extractMessageThreads = (html) => {
	const $ = cheerio.load(html, { decodeEntities: false });

	const privateMessageContainers = $(html).find("li.media > div.media-body").not("div.thread-list-header");
	const privateMessages = privateMessageContainers
		.map((i, elem) => {
			const to = extractTo(elem);
			const unreadMessageCount = extractMessageCount(elem, 3);
			const messageCount = extractMessageCount(elem, 4);
			const lastMessageSent = extractLastMessageSent(elem);

			return {
				to: to,
				unreadMessageCount: unreadMessageCount,
				messageCount: messageCount,
				lastMessageSent: lastMessageSent,
			};
		})
		.get();

	return privateMessages;
};

extractTo = (html) => {
	const $ = cheerio.load(html, { decodeEntities: false });

	const toElement = $(html).find("div.thread-title-user > a");
	const toUsername = toElement.text().trim();
	const toSlug = toElement.attr("href").split("/")[2];

	return { username: toUsername, slug: toSlug };
};

extractMessageCount = (html, childNumber) => {
	const $ = cheerio.load(html, { decodeEntities: false });

	const messageCountElement = $(html).find(`div.thread-num-msgs:nth-child(${childNumber})`);
	const messageCountString = messageCountElement.text().split(" ")[0].trim();
	const messageCount = parseInt(messageCountString);

	return messageCount;
};

extractLastMessageSent = (html) => {
	const $ = cheerio.load(html, { decodeEntities: false });

	const lastMessageSentElement = $(html).find("div.thread-time");
	const lastMessageSentString = lastMessageSentElement.text().trim();
	const lastMessageSent = new Date(lastMessageSentString).toISOString();

	return lastMessageSent;
};
