const path = require('path')
const fs = require('fs').promises
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

const OPUS_URL = 'https://clip.opus.pro/dashboard'
const API_URL = 'http://localhost:3000/content/process'
const CLIP_DESCRIPTION = 'Funniest Parts Please' // sample description for test
const EMAIL = process.env.email

const COOKIES_PATH = path.join(__dirname, '..', 'cookies.json')
const USER_DATA_DIR = path.join(__dirname, '..', 'browser-data')

const BROWSER_OPTIONS = {
  headless: false,
  defaultViewport: null,
  args: ['--disable-blink-features=AutomationControlled'],
  userDataDir: USER_DATA_DIR,
}

const stealthPlugin = StealthPlugin()
stealthPlugin.enabledEvasions.delete('iframe.contentWindow')
stealthPlugin.enabledEvasions.delete('media.codecs')
puppeteer.use(stealthPlugin)

async function saveCookies(page) {
  try {
    const cookies = await page.cookies()
    await fs.writeFile(COOKIES_PATH, JSON.stringify(cookies, null, 2))
    console.log('Cookies saved!')
  } catch (error) {
    console.error('Error saving cookies:', error.message)
  }
}

async function loadCookies(page) {
  try {
    const cookiesString = await fs.readFile(COOKIES_PATH, 'utf8')
    const cookies = JSON.parse(cookiesString)
    await page.setCookie(...cookies)
    console.log('Cookies loaded!')
    return true
  } catch (error) {
    console.log('No saved cookies found, will need to login')
    return false
  }
}

async function isLoggedIn(page) {
  const emailInput = await page.$('input[aria-label="email"]')
  return emailInput === null
}

async function performLogin(page) {
  try {
    console.log('Performing login...')
    await page.waitForSelector('input[aria-label="email"]', { visible: true, timeout: 10000 })
    await page.type('input[aria-label="email"]', EMAIL, { delay: 50 })

    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 })

    const loggedIn = await isLoggedIn(page)
    if (loggedIn) {
      await saveCookies(page)
      console.log('Login successful!')
      return true
    } else {
      console.log('Login may have failed')
      return false
    }
  } catch (error) {
    console.error('Login error:', error.message)
    return false
  }
}

async function ensureLoggedIn(page) {
  const cookiesLoaded = await loadCookies(page)
  await page.goto(OPUS_URL, { waitUntil: 'networkidle2' })

  const loggedIn = await isLoggedIn(page)

  if (loggedIn) {
    console.log('Already logged in using saved session!')
    return true
  }

  if (!cookiesLoaded) {
    return await performLogin(page)
  }

  console.log('Cookies expired, attempting login...')
  return await performLogin(page)
}


async function getNextVideo() {
  try {
    const response = await fetch(API_URL)
    const data = await response.json()

    if (!data.videoUrl || !data.message) {
      console.log('No video URL found in response')
      return null
    }

    console.log('Video URL retrieved:', data.videoUrl)
    return data
  } catch (error) {
    console.error('Error fetching video URL:', error.message)
    return null
  }
}

async function inputVideoUrl(page, videoUrl) {
  try {
    await page.waitForSelector('input[aria-label="Input url"]', { visible: true, timeout: 10000 })
    await page.type('input[aria-label="Input url"]', videoUrl, { delay: 0 })
    console.log('Video URL entered')
  } catch (error) {
    console.error('Error inputting video URL:', error.message)
    throw error
  }
}

async function inputClipDescription(page, description) {
  try {
    const selector = 'input[aria-label="Tell us what you would like to include in the final clips"]'
    await page.waitForSelector(selector, { visible: true, timeout: 10000 })
    await page.type(selector, description, { delay: 50 })
    console.log('Clip description entered')
  } catch (error) {
    console.error('Error inputting clip description:', error.message)
    throw error
  }
}

async function processClip() {
  let browser = null

  try {
    console.log('Launching browser...')
    browser = await puppeteer.launch(BROWSER_OPTIONS)
    const page = await browser.newPage()

    const loggedIn = await ensureLoggedIn(page)
    if (!loggedIn) {
      throw new Error('Failed to login to Opus')
    }

    const video = await getNextVideo()
    const url = video.videoUrl
    const message = video.message

    if (!url) {
      console.log('No video to process')
      return
    }

    if (!message) {
      console.log('No video to process')
      return

    }

    await inputVideoUrl(page, url)
    await inputClipDescription(page, message)

    console.log('Clip processing initiated')

  } catch (error) {
    console.error('Error processing clip:', error.message)
    throw error
  } finally {
  }
}

if (require.main === module) {
  processClip()
    .then(() => {
      console.log('Process completed')
      //process.exit(0) close browser after completion
    })
    .catch((error) => {
      console.error('Process failed:', error)
      process.exit(1)
    })
}
