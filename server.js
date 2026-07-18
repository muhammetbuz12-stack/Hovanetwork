const express = require('express');
const path = require('path');
const { Rcon } = require('rcon-client');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==== server.properties'ten alınan RCON bilgileri ====
const RCON_HOST = '127.0.0.1'; // sunucu ile aynı makinede çalışıyorsa localhost
const RCON_PORT = 25575;       // rcon.port
const RCON_PASSWORD = '32B-21dg-Hgb'; // rcon.password
// =======================================================

// Ranklar ve fiyatları (TL)
const RANKS = {
  vip:        { price: 100, group: 'vip' },
  vipplus:    { price: 150, group: 'vipplus' },
  hvip:       { price: 200, group: 'hvip' },
  hvipplus:   { price: 250, group: 'hvipplus' },
  hovavip:    { price: 300, group: 'hovavip' },
  hovavipplus:{ price: 350, group: 'hovavipplus' },
};

// Sunucuya RCON komutu gönderen yardımcı fonksiyon
async function sendRconCommand(command) {
  const rcon = await Rcon.connect({
    host: RCON_HOST,
    port: RCON_PORT,
    password: RCON_PASSWORD,
  });
  const response = await rcon.send(command);
  await rcon.end();
  return response;
}

// Rank satın alma endpoint'i
app.post('/api/buy', async (req, res) => {
  const { playerName, rankId } = req.body;

  if (!playerName || !rankId) {
    return res.status(400).json({ success: false, message: 'Oyuncu ismi ve rank gerekli.' });
  }

  const rank = RANKS[rankId];
  if (!rank) {
    return res.status(400).json({ success: false, message: 'Geçersiz rank.' });
  }

  // LuckPerms kullanıyorsanız aşağıdaki komut otomatik çalışır.
  // Farklı bir permission eklentisi kullanıyorsanız komutu değiştirin.
  const command = `lp user ${playerName} parent add ${rank.group}`;

  try {
    const result = await sendRconCommand(command);
    return res.json({
      success: true,
      message: `${playerName} adlı oyuncuya ${rankId.toUpperCase()} rankı verildi.`,
      rconResponse: result,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'RCON bağlantı hatası: ' + err.message,
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Hovanetwork paneli http://localhost:${PORT} adresinde çalışıyor`);
});
