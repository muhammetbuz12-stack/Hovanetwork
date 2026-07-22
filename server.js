require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { Rcon } = require('rcon-client');

const app = express();
app.use(express.json());

// public/ klasörü yoksa açıkça uyar (en sık "server.js çalışmıyor" nedeni budur)
const PUBLIC_DIR = path.join(__dirname, 'public');
if (!fs.existsSync(PUBLIC_DIR)) {
  console.error('[HATA] "public" klasörü bulunamadı: ' + PUBLIC_DIR);
  console.error('       site.html dosyasının server.js ile aynı yerdeki "public" klasöründe olduğundan emin ol.');
} else if (!fs.existsSync(path.join(PUBLIC_DIR, 'site.html'))) {
  console.warn('[UYARI] public/site.html bulunamadı. Site açılmayabilir.');
}
app.use(express.static(PUBLIC_DIR));

// ---- Ayarlar ----
// .env dosyası varsa oradaki değerler kullanılır, yoksa aşağıdaki
// varsayılanlar devreye girer (böylece .env kurmadan da çalışır).
const RCON_HOST = process.env.RCON_HOST || 'Hovanetwork.duckdns.org';
const RCON_PORT = parseInt(process.env.RCON_PORT || '25575', 10);
const RCON_PASSWORD = process.env.RCON_PASSWORD || 'VHlsGxbyLeVT';
const ADMIN_KEY = process.env.ADMIN_KEY || 'd7d426d051c09c3ec06314993e16a6d5';
const PORT = process.env.PORT || 3000;

// RCON'a bağlanıp tek komut çalıştırıp bağlantıyı kapatan yardımcı fonksiyon.
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

// Admin endpoint'lerini korumak için anahtar kontrolü.
function checkAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Yetkisiz erişim' });
  }
  next();
}

// Herkese açık: sunucu çevrimiçi mi kontrolü
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
    console.error('[RCON HATASI /api/players]', err.message);
    res.status(500).json({ success: false, error: rconErrorMessage(err) });
  }
});

// Korumalı: serbest RCON komutu gönder
app.post('/api/command', checkAdmin, async (req, res) => {
  const { command } = req.body || {};
  if (!command || typeof command !== 'string') {
    return res.status(400).json({ success: false, error: 'Komut gerekli' });
  }
  try {
    const result = await sendRconCommand(command);
    res.json({ success: true, result });
  } catch (err) {
    console.error('[RCON HATASI /api/command]', err.message);
    res.status(500).json({ success: false, error: rconErrorMessage(err) });
  }
});

// RCON hatalarını anlaşılır Türkçe mesaja çevirir (terminaldeki en sık hatalar)
function rconErrorMessage(err) {
  const msg = (err && err.message) || String(err);
  if (msg.includes('ECONNREFUSED')) {
    return 'RCON bağlantısı reddedildi. Sunucu kapalı olabilir ya da RCON_HOST/RCON_PORT yanlış.';
  }
  if (msg.includes('ETIMEDOUT') || msg.includes('timeout')) {
    return 'RCON bağlantısı zaman aşımına uğradı. Firewall RCON portunu (25575) engelliyor olabilir.';
  }
  if (msg.toLowerCase().includes('authentication') || msg.toLowerCase().includes('password')) {
    return 'RCON kimlik doğrulaması başarısız. RCON_PASSWORD, server.properties dosyasındaki rcon.password ile birebir aynı olmalı.';
  }
  return msg;
}

const server = app.listen(PORT, () => {
  console.log('----------------------------------------------------');
  console.log(`Hovanetwork paneli çalışıyor:  http://localhost:${PORT}`);
  console.log(`RCON hedefi:                   ${RCON_HOST}:${RCON_PORT}`);
  console.log(`Admin key:                     ${ADMIN_KEY}`);
  console.log('----------------------------------------------------');

  // Başlangıçta RCON bağlantısını test et, sorun varsa hemen terminalde göster.
  sendRconCommand('list')
    .then(() => console.log('[OK] RCON bağlantısı başarılı.'))
    .catch(err => console.error('[UYARI] RCON bağlantısı kurulamadı ->', rconErrorMessage(err)));
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[HATA] ${PORT} portu zaten kullanımda. .env dosyasında farklı bir PORT belirle.`);
  } else {
    console.error('[HATA] Sunucu başlatılamadı:', err.message);
  }
  process.exit(1);
});
