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

  // Szablon nazwy wyjściowej z tytułem z YouTube
  const outputTemplate = path.join(DOWNLOAD_DIR, '%(title)s.%(ext)s');

  // Używamy klientów mobilnych (mweb, android), które mijają blokady IP 429 dla serwerów chmurowych
  const cmd = `yt-dlp -x --audio-format mp3 --extractor-args "youtube:player_client=mweb,android" -o "${outputTemplate}" "${url}"`;

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error('Błąd yt-dlp:', stderr || error.message);
      return res.status(500).json({ error: 'Błąd konwersji yt-dlp' });
    }

    fs.readdir(DOWNLOAD_DIR, (err, files) => {
      if (err || files.length === 0) {
        return res.status(500).json({ error: 'Nie odnaleziono pliku.' });
      }

      // Znajdź najnowszy pobrany plik
      const latestFile = files
        .map(file => ({
          name: file,
          time: fs.statSync(path.join(DOWNLOAD_DIR, file)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time)[0].name;

      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.get('host');
      const downloadUrl = `${protocol}://${host}/downloads/${encodeURIComponent(latestFile)}`;

      res.json({ url: downloadUrl, filename: latestFile });
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});
