const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR);
}

app.use('/downloads', express.static(DOWNLOAD_DIR));

app.post('/convert', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Brak URL' });

  const outputFilename = `audio_${Date.now()}.mp3`;
  const outputPath = path.join(DOWNLOAD_DIR, outputFilename);

  // Wywołanie zainstalowanego yt-dlp z konwersją do mp3
  const cmd = `yt-dlp -x --audio-format mp3 -o "${outputPath}" "${url}"`;

  exec(cmd, (error) => {
    if (error) {
      console.error('Błąd yt-dlp:', error);
      return res.status(500).json({ error: 'Konwersja nie powiodła się.' });
    }

    res.json({ url: `http://localhost:3000/downloads/${outputFilename}` });
  });
});

app.listen(3000, () => {
  console.log('Serwer YT Downloader Dim3n działa na http://localhost:3000');
});