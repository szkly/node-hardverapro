const request = require("request-promise-native").defaults({
	resolveWithFullResponse: true,
	baseUrl: "https://hardverapro.hu",
	headers: {
		"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
	},
});

module.exports = {
	get: async (endpoint, slug, queryString, authCookieString) => {
		const jar = request.jar();

		if (endpoint === module.exports.endpoints.SEARCH) {
			const sortCookieString = request.cookie("prf_ls_uad=time.d.200.normal");
			jar.setCookie(sortCookieString, "https://hardverapro.hu");
		}

		if (authCookieString) {
			const authCookie = request.cookie(`identifier=${authCookieString}`);
			jar.setCookie(authCookie, "https://hardverapro.hu");
		}

		const options = {
			uri: slug ? `${endpoint}${slug}` : endpoint,
			qs: queryString,
			jar: jar,
		};

		try {
			return await request.get(options);
		} catch (err) {
			console.error(err);
		}
	},

	post: async (endpoint, form, cookieString) => {
		const jar = request.jar();
		if (cookieString) {
			jar.setCookie(cookieString, "https://hardverapro.hu");
		}

		const options = {
			uri: endpoint,
			form: form,
			jar: jar,
		};

		if (options.uri === module.exports.endpoints.AUTH) {
			options.headers = { accept: "application/json, text/javascript, */*; q=0.01" };
		}

		try {
			return await request.post(options);
		} catch (err) {
			console.error(err);
		}
	},

	endpoints: {
		ADS: "/apro/",
		AUTH: "/muvelet/hozzaferes/belepes.php",
		PRIVATE_MESSAGES: "/privatok/listaz.php",
		RATINGS: "/ertekelesek/index.html",
		SEARCH: "/aprok/keres.php",
		USERS: "/tag/",
	},
};
