import express from 'express'
import ytdl from 'ytdl-core';
import cors from 'cors'
import { config } from 'dotenv';

const app = express();

config({path:"./.env"})

app.use(cors({
    origin:process.env.FRONTEND_URL
}))
app.use(express.json())
app.use(express.urlencoded({
    extended: true
}))

// Route for getting file info
app.get('/api/file-info/:url', async (req, res) => {

    console.log('going to get video info');

    const videoUrl = decodeURIComponent(req.params.url); // Get video URL from query parameter

    try {
        const info = await ytdl.getInfo(videoUrl);

        let szn = ['B', 'KB', 'MB', 'GB']
        const getSZN = (len) => {
            if (isNaN(len)) {
                console.log(len);
                return `0B`
            }
            for (let i = 0; ; i++) {
                if (len / 1024 < 1) {
                    len = len + ''
                    return len.slice(0, len.indexOf('.') + 3) + szn[i]
                }
                len /= 1024;
            }
        }
        // Extract relevant information from the video metadata
        const fileInfo = {
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails[1].url,
            related_videos: info.related_videos.map((relatedVideo) => (
                {
                    thumbnail: relatedVideo.thumbnails[1].url,
                    title: relatedVideo.title
                }
            )),
        };

        const audioInfo = info.formats.filter((format) => (
            !format.hasVideo && format.hasAudio
        )).map((format) => (
            {
                downloadLink: format.url,
                size: getSZN(format.contentLength),
                file: format.mimeType.slice(0, format.mimeType.indexOf(';'))
            }
        ))
        const videoInfo = info.formats.filter((format) => (format.hasVideo)).map((format) => (
            {
                downloadLink: format.url,
                size: getSZN(format.contentLength),
                quality: `${format.qualityLabel}${format.hasAudio ? '' : ' No Audio'}`
            }
        ))

        res.status(200).json({
            fileInfo,
            videoInfo,
            audioInfo
        });
    } catch (error) {
        console.error('Error fetching video info:', error);
        res.status(500).send('Error fetching video info');
    }
});

app.listen(4000,() => {
  console.log(`server is running at port 4000`);
  
}
)