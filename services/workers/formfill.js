const path = require('path')
const fs = require('fs').promises
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

const OPUS_URL = 'https://clip.opus.pro/dashboard'
const API_URL = 'http://localhost:3000/content/process'
const COUNT_URL = 'http://localhost:3000/content/count-queued'

const EMAIL = process.env.email

const COOKIES_PATH = path.join(__dirname, '..', 'cookies.json')
const USER_DATA_DIR = path.join(__dirname, '..', 'browser-data')

const BROWSER_OPTIONS = {
  headless: false,
  defaultViewport: null,
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

async function getClips(page) {
  try {
    await page.waitForSelector('button[aria-label="Get clips in 1 click"]', { visible: true, timeout: 10000 })
    await page.click('button[aria-label="Get clips in 1 click"]')
    console.log('successfully clicked get clicks')
    return true
  }
  catch (err) {
    console.log(`Problem clicking get clips: ${err}`)
    return false
  }

}

async function getCount() {
  try {
    const response = await fetch(COUNT_URL)
    const count = parseInt(await response.text())
    return count
  } catch (error) {
    console.error('Error getting count:', error)
    return 0
  }

}

async function setDone(videoId) {
  try {
    const res = await fetch(`http://localhost:3000/content/completed/${videoId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Failed to mark done: ${res.status} ${text}`)
    }

    const data = await res.json()
    console.log('Set video to done:', data.message)
    return true
  } catch (err) {
    console.error('Error setting done:', err.message)
    return false
  }
}

async function ensureLoggedIn(page) {
  //const cookiesLoaded = await loadCookies(page)
  await page.goto(OPUS_URL, { waitUntil: 'networkidle2' })

  const loggedIn = await isLoggedIn(page)

  if (loggedIn) {
    console.log('Already logged in using saved session!')
    return true
  }

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
    await page.type('input[aria-label="Input url"]', videoUrl) // delay of 0ms to mimic copy paste
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

async function processClip(page) {
  try {
    await page.goto(OPUS_URL, { waitUntil: 'networkidle2' })
    const video = await getNextVideo()
    if (!video || !video.videoUrl || !video.message) {
      console.log('No video to process')
      return false
    }

    const { videoUrl: url, message, _id: videoId } = video

    await inputVideoUrl(page, url)
    await inputClipDescription(page, message)

    console.log('Clip processing initiated')

    const isSuccess = await getClips(page)

    if (isSuccess) {
      await setDone(videoId)
    }

    return true
  } catch (error) {
    console.error('Error processing clip:', error.message)
    throw error
  }
}

async function processAllVideos() {
  let browser = null
  let page = null

  try {
    console.log('Launching browser...')
    browser = await puppeteer.launch(BROWSER_OPTIONS)
    page = await browser.newPage()

    const loggedIn = await ensureLoggedIn(page)
    if (!loggedIn) {
      throw new Error('Failed to login to Opus')
    }

    while (true) {
      try {
        const count = await getCount()

        if (count === 0) {
          console.log('No queued videos, waiting 2 seconds then exiting...')
          await new Promise(resolve => setTimeout(resolve, 2000))
          break
        }

        await processClip(page)
        await new Promise(resolve => setTimeout(resolve, 5000))
      } catch (error) {
        console.error('Error in processing loop:', error)
        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
    console.log('Process completed - no more queued videos')
  } catch (error) {
    console.error('Fatal error:', error)
  }
}

if (require.main === module) {
  processAllVideos()
    .then(() => {
      console.log('Process completed')
      //process.exit(0) close browser after completion 
    })
    .catch((error) => {
      console.error('Process failed:', error)
      // process.exit(1)
    })
}
