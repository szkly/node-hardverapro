const request = require("request-promise-native").defaults({
	resolveWithFullResponse: true,
	baseUrl: "https://hardverapro.hu",
	headers: {
		"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36"
	}
});

module.exports = {
	get: async (path, qs, cookieString) => {
		//prf_ls_uad=TYPE.SORT_BY.ITEMS_PER_PAGE.normal
		// time - új hirdetések
		// lstup - frissítettek
		// price.a - olcsók (ár növekvő)
		// price.d - drágák (ár csökkenő)

		const jar = request.jar();
		const sortCookieString = request.cookie("prf_ls_uad=time.d.200.normal");

		jar.setCookie(sortCookieString, "https://hardverapro.hu");

		if (cookieString) {
			jar.setCookie(cookieString, "https://hardverapro.hu");
		}

		const options = {
			uri: path,
			queryString: qs,
			jar: jar
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
			form: form
		};

		try {
			return await request.post(options);
		} catch (err) {
			console.error(err);
		}
	}
};
