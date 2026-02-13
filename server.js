import express from 'express';
import fs from 'fs';
import path from 'path';
import morgan from 'morgan';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const LOG_FILE = path.join(__dirname, 'logs.jsonl');

app.use(express.json());
app.use(morgan('combined'));
app.use(express.static(path.join(__dirname, 'public')));

// Simple ping endpoint
app.get('/ping', (req, res) => {
  res.status(200).send('ok');
});

// Log endpoint
app.post('/log', (req, res) => {
  const entry = {
    ...req.body,
    serverReceivedAt: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
  };

  fs.appendFile(LOG_FILE, JSON.stringify(entry) + '\n', (err) => {
    if (err) {
      console.error('Failed to write log:', err);
      return res.status(500).json({ ok: false });
    }
    res.json({ ok: true });
  });
});

// Logs endpoint (for dashboard / inspection)
app.get('/logs', (req, res) => {
  fs.readFile(LOG_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read logs:', err);
      return res.status(500).json({ ok: false });
    }

    const lines = data.trim().split('\n').filter(Boolean);
    const entries = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);

    res.json(entries);
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

