const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const API_KEY = process.env.YT_API_KEY
const QUERY = 'stand up comedy'

async function fetchVideos() {
    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.search = new URLSearchParams({
        part: "snippet",
        type: "video",
        q: QUERY,
        videoDuration: "medium",      
        videoEmbeddable: "true",     
        maxResults: "1",
        order: "viewCount",
        key: API_KEY
    });

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();

    
    const videos = data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));

    return videos;
}


fetchVideos()
  .then(videos => console.log(videos))
  .catch(err => console.error(err));