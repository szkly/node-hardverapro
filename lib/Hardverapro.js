const ads = require("../lib/resources/ads");

class Hardverapro {
	async listAds(keyword) {
		return await ads.listAds(keyword);
	}

	async getAd(path) {
		return await ads.getAd(path);
	}
}

module.exports = Hardverapro;
