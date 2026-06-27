const { chromium } = require("playwright");
const path = require("path");

let context;
let page;

let isBusy = false;

function getBusyStatus() {
    return isBusy;
}

function setBusyStatus(value) {
    isBusy = value;
}

async function startBrowser() {

    if (context) {
        return page;
    }

    context = await chromium.launchPersistentContext(
        path.join(__dirname, "chrome-profile"),
        {
            headless: false,

            viewport: null,

            args: [
                "--start-maximized"
            ],

            permissions: [
                "geolocation"
            ],

            geolocation: {
                latitude: 26.193807,
                longitude: 88.943849
            },

            locale: "en-US"
        }
    );

    const pages = context.pages();

    if (pages.length > 0) {
        page = pages[0];
    } else {
        page = await context.newPage();
    }

    page.on("console", msg => {
        console.log("PAGE:", msg.text());
    });

    if (!page.url().startsWith("https://businessweb-mobi.com")) {

        await page.goto(
            "https://businessweb-mobi.com/",
            {
                waitUntil: "domcontentloaded"
            }
        );

    }

    console.log("Website Opened");

    return page;
}

function getPage() {
    return page;
}


function getContext() {
    return context;
}

module.exports = {
    startBrowser,
    getPage,
    getContext,
    getBusyStatus,
    setBusyStatus
};