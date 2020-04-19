const auth = require("../lib/resources/auth");
const ads = require("../lib/resources/ads");
const privateMessages = require("../lib/resources/private-messages");
const ratings = require("../lib/resources/ratings");
const search = require("../lib/resources/search");
const users = require("../lib/resources/users");

class Hardverapro {
	async login(email, password) {
		return await auth.login(email, password);
	}

	async getAd(path) {
		return await ads.getAd(path);
	}

	async listPrivateMessages(authCookie) {
		return await privateMessages.listPrivateMessages(authCookie);
	}

	async listRatings(authCookie) {
		return await ratings.listRatings(authCookie);
	}

	async listUserRatings(username) {
		return await ratings.listUserRatings(username);
	}

	async searchAds(query) {
		return await search.searchAds(query);
	}

	async getUser(username) {
		return await users.getUser(username);
	}
}

module.exports = Hardverapro;
