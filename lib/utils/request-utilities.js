const request = require("request-promise-native").defaults({
	resolveWithFullResponse: true,
	baseUrl: "https://hardverapro.hu",
	headers: {
		"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
	},
});

module.exports = {
	get: async (endpoint, slug, qs, cookieString) => {
		const jar = request.jar();
		const sortCookieString = request.cookie("prf_ls_uad=time.d.200.normal");

		jar.setCookie(sortCookieString, "https://hardverapro.hu");

		if (cookieString) {
			jar.setCookie(cookieString, "https://hardverapro.hu");
		}

		const options = {
			uri: slug ? `${endpoint}${slug}` : endpoint,
			queryString: qs,
			jar: jar,
		};

		try {
			return await request.get(options);
		} catch (err) {
			console.error(err);
		}
	},

	post: async (path, form) => {
		const options = {
			uri: path,
			form: form,
		};

		try {
			return await request.post(options);
		} catch (err) {
			console.error(err);
		}
	},

	endpoints: {
		ADS: "/apro/",
		AUTH: "/fiok/belepes.php",
		RATINGS: "/ertekelesek/index.html",
		SEARCH: "/aprok/keres.php",
		USERS: "/tag/",
	},
};
