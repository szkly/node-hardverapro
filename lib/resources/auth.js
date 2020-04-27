const request = require("../utils/request-utilities");
const cheerio = require("cheerio");

module.exports = {
	login: async (email, password) => {
        const initResponse = await request.get(request.endpoints.AUTH);

		const fidentifier = getFidentifier(initResponse.body);
		const form = {
			fidentifier: fidentifier,
			email: email,
			pass: password,
			all: 1,
			stay: 1,
			no_ip_check: 1,
			leave_others: 1,
		};
        const cookieString = initResponse.headers["set-cookie"][2].split(";")[0];

        const authResponse = await request.post(request.endpoints.AUTH, form, cookieString);
        
		if (authResponse.headers["set-cookie"]) {
			return extractAuthCookieString(authResponse);
		} else {
			return "";
		}
	},
};

extractAuthCookieString = (resp) => {
	const cookies = resp.headers["set-cookie"];

	const authCookieString = cookies[0].split(";")[0].split("=")[1];

	return authCookieString;
};

getFidentifier = (html) => {
	const $ = cheerio.load(html, { decodeEntities: false });

	const fidentifierString = $("input[name=fidentifier]").attr("value");

	return fidentifierString;
};
