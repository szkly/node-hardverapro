const ads = require("../lib/resources/ads");
const users = require("../lib/resources/users");

class Hardverapro {
	async listAds(keyword) {
		return await ads.listAds(keyword);
	}

	async getAd(path) {
		return await ads.getAd(path);
	}

	async getUser(username) {
		return await users.getUser(username);
	}
}

module.exports = Hardverapro;
