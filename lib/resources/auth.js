const request = require("../utils/request-utilities");
const cheerio = require("cheerio");

const users = require("./users");

module.exports = {
	login: async (email, password) => {
		const initResponse = await request.get(request.endpoints.AUTH);

		const form = generateFormData(initResponse.body, email, password);
		const cookieString = extractInitCookie(initResponse);

		const authResponse = await request.post(request.endpoints.AUTH, form, cookieString);

		const authBody = JSON.parse(authResponse.body);
		if (authBody.hasOwnProperty("message") && authBody["message"] === "Sikeres belépés, rögtön továbbítunk...") {
			return extractAuthCookieString(authResponse);
		} else {
			return extractErrorMessage(authBody);
		}
	},

	getMe: async (authCookie) => {
		const response = await request.get(request.endpoints.AUTH, null, null, authCookie);
		const username = extractOwnUsername(response.body);

		const me = await users.getUser(username);

		return me;
	},
};

extractOwnUsername = (html) => {
	const $ = cheerio.load(html, { decodeEntities: false });
	const username = $(".user-dropdown-menu > h6 > a").text().trim();
	return username;
};

extractAuthCookieString = (resp) => {
	const cookies = resp.headers["set-cookie"];

	const authCookieString = cookies[0].split(";")[0].split("=")[1];

	return authCookieString;
};

extractErrorMessage = (responseBody) => {
	if (responseBody.hasOwnProperty("message")) {
		return { statusCode: 400, errorMessage: responseBody.message };
	} else if (responseBody.hasOwnProperty("formError")) {
		return { statusCode: 401, errorMessage: responseBody.formError };
	} else {
		return { statusCode: 429, errorMessage: "HardverApró returned a CAPTCHA" };
	}
};

generateFormData = (html, email, password) => {
	const fidentifier = extractFidentifier(html);

	return {
		fidentifier: fidentifier,
		email: email,
		pass: password,
		all: 1,
		stay: 1,
		no_ip_check: 1,
		leave_others: 1,
	};
};

extractFidentifier = (html) => {
	const $ = cheerio.load(html, { decodeEntities: false });

	const fidentifierString = $("input[name=fidentifier]").attr("value");

	return fidentifierString;
};

extractInitCookie = (response) => {
	const cookies = response.headers["set-cookie"];

	const initCookie = cookies[2].split(";")[0];

	return initCookie;
};
