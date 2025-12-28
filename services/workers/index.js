const puppeteer = require('puppeteer')

async function getBunnies(){
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null
    })

    const url = 'https://www.opus.pro'
    const page = await browser.newPage();
    await page.goto(url)

}

getBunnies()