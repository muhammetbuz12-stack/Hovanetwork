require('dotenv').config();
const express = require('express');
const path = require('path');
const { Rcon } = require('rcon-client');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- Ayarlar (.env dosyasından okunur) ----
const RCON_HOST = process.env.RCON_HOST || 'Hovanetwork.duckdns.org';
const RCON_PORT = parseInt(process.env.RCON_PORT || '25575', 10);
const RCON_PASSWORD = process.env.RCON_PASSWORD || '';
const ADMIN_KEY = process.env.ADMIN_KEY || '';
const PORT = process.env.PORT || 3000;

if (!RCON_PASSWORD) {
  console.warn('[UYARI] RCON_PASSWORD tanımlı değil. .env dosyanı kontrol et.');
}
if (!ADMIN_KEY) {
  console.warn('[UYARI] ADMIN_KEY tanımlı değil. Admin panel herkese açık kalabilir!');
}

// RCON'a bağlanıp tek komut çalıştırıp bağlantıyı kapatan yardımcı fonksiyon.
// Her istekte yeni bağlantı açmak, uzun süre açık kalan bağlantıların
// düşmesinden kaynaklanan sorunları engeller.
async function sendRconCommand(command) {
  const rcon = await Rcon.connect({
    host: RCON_HOST,
    port: RCON_PORT,
    password: RCON_PASSWORD,
    timeout: 5000,
  });
  try {
    const response = await rcon.send(command);
    return response;
  } finally {
    await rcon.end();
  }
}

// Admin endpoint'lerini korumak için basit anahtar kontrolü.
// Bu anahtar RCON şifresinden FARKLI olmalı; RCON şifresini
// hiçbir zaman tarayıcıya/istemciye göndermiyoruz.
function checkAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Yetkisiz erişim' });
  }
  next();
}

// Herkese açık: sunucu çevrimiçi mi kontrolü (rakam/isim göndermez)
app.get('/api/status', async (req, res) => {
  try {
    await sendRconCommand('list');
    res.json({ online: true });
  } catch (err) {
    res.json({ online: false });
  }
});

// Korumalı: oyuncu listesi
app.get('/api/players', checkAdmin, async (req, res) => {
  try {
    const result = await sendRconCommand('list');
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Korumalı: serbest RCON komutu gönder
app.post('/api/command', checkAdmin, async (req, res) => {
  const { command } = req.body;
  if (!command || typeof command !== 'string') {
    return res.status(400).json({ success: false, error: 'Komut gerekli' });
  }
  try {
    const result = await sendRconCommand(command);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Hovanetwork paneli çalışıyor: http://localhost:${PORT}`);
  console.log(`RCON hedefi: ${RCON_HOST}:${RCON_PORT}`);
});
