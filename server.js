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

app.get('/', (req, res) => {
  res.send('Serwer YT Downloader Dim3n działa poprawnie!');
});

app.post('/convert', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'Brak URL' });

  const outputFilename = `audio_${Date.now()}.mp3`;
  const outputPath = path.join(DOWNLOAD_DIR, outputFilename);

  // Użycie pliku ciasteczek cookies.txt do ominięcia weryfikacji botów na Renderze
  const cmd = `yt-dlp -x --audio-format mp3 --cookies cookies.txt -o "${outputPath}" "${url}"`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error('Błąd yt-dlp:', stderr || error.message);
      return res.status(500).json({ error: 'Błąd konwersji yt-dlp' });
    }

    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    const downloadUrl = `${protocol}://${host}/downloads/${outputFilename}`;

    res.json({ url: downloadUrl });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
