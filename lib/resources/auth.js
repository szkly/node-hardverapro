const puppeteer = require("puppeteer");

module.exports = {
	login: async (email, password) => {
		const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
		const url = "https://hardverapro.hu/fiok/belepes.php";
		const page = await browser.newPage();

		await page.goto(url);

		await page.waitForSelector("input[type=email]");
		await page.type("input[type=email]", email);
		await page.type("input[type=password]", password);
		await page.click("input[name=all]");

		await page.click("button[type=submit]");
		await page.waitForNavigation();

		const cookies = await page.cookies();

		const authCookieString = cookies.filter((cookie) => cookie.name === "identifier")[0].value;

		await browser.close();

		return authCookieString;
	},
};
