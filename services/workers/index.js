const path = require('path')
const fs = require('fs').promises
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

const stealthPlugin = StealthPlugin()

stealthPlugin.enabledEvasions.delete('iframe.contentWindow')
stealthPlugin.enabledEvasions.delete('media.codecs')

const email = process.env.email

puppeteer.use(stealthPlugin)


const cookiesPath = path.join(__dirname, '..', 'cookies.json')
const userDataDir = path.join(__dirname, '..', 'browser-data')


async function saveCookies(page) {
  const cookies = await page.cookies()
  await fs.writeFile(cookiesPath, JSON.stringify(cookies, null, 2))
  console.log('Cookies saved!')
}

async function getUrl() {
  try {
    const res = await fetch('http://localhost:3000/content/process')
    const json = await res.json()
    console.log(json)
    return json.videoUrl
   
  } catch (err) {
    console.error(err)
  }
}

// Helper function to load cookies
async function loadCookies(page) {
  try {
    const cookiesString = await fs.readFile(cookiesPath, 'utf8')
    const cookies = JSON.parse(cookiesString)
    await page.setCookie(...cookies)
    console.log('Cookies loaded!')
    return true
  } catch (error) {
    console.log('No saved cookies found, will need to login')
    return false
  }
}

async function getBunnies(){
    const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--disable-blink-features=AutomationControlled'],
    userDataDir: userDataDir,
  })

    const url = 'https://clip.opus.pro/dashboard'
    const page = await browser.newPage();
    
   
    const cookiesLoaded = await loadCookies(page)
    
    await page.goto(url, { waitUntil: 'networkidle2' })
    
    
    const isLoggedIn = await page.$('input[aria-label="email"]') === null
    
    if (!isLoggedIn && !cookiesLoaded) {
      console.log('Not logged in, performing login...')
      await page.waitForSelector('input[aria-label="email"]', { visible: true });
      await page.type('input[aria-label="email"]', email, { delay: 50 });
      
      // wait for loogin
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })
      
     
      await saveCookies(page)
    } else if (isLoggedIn) {
      console.log('Already logged in using saved cookies/session!')
    }

    const video = await getUrl()
    console.log(video)
   

    await page.waitForSelector('input[aria-label="Input url"]', { visible: true });
    await page.type('input[aria-label="Input url"]', video, { delay: 0 });
   




   

}

getBunnies()