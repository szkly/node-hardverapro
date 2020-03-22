const ads = require("../lib/resources/ads");

class Hardverapro {
	async getAds(keyword) {
		return await ads.getAds(keyword);
	}

	async getAdDetails(path) {
		return await ads.getAdDetails(path);
	}
}

module.exports = Hardverapro;
