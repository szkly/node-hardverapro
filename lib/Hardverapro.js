const ads = require("../lib/resources/ads");

class Hardverapro {
	async getAds(keyword) {
		return await ads.getAds(keyword);
	}
}

module.exports = Hardverapro;
