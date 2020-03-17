const request = require("request-promise-native").defaults({
	resolveWithFullResponse: true,
	baseUrl: "https://hardverapro.hu",
	headers: {
		"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36"
	}
});

module.exports = {
	get: async (path, qs) => {
		const options = {
			uri: path,
			queryString: qs
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
