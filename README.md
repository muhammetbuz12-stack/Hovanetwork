# Hovanetwork Panel (RCON'lu)

## Kurulum

1. Bağımlılıkları yükle:
   ```
   npm install
   ```

2. `.env.example` dosyasını `.env` olarak kopyala ve gerçek bilgilerini gir:
   ```
   cp .env.example .env
   ```
   - `RCON_PASSWORD` → `server.properties` dosyandaki `rcon.password` ile
     birebir aynı olmalı.
   - `ADMIN_KEY` → kendi belirlediğin bir şifre. Boş bırakırsan `server.js`
     her başlatmada rastgele bir anahtar üretip terminale yazdırır (ama
     her restart'ta değişir, kalıcı bir panel için kendin belirlemen daha iyi).

3. Sunucuyu başlat:
   ```
   npm start
   ```

4. Tarayıcıda `http://localhost:3000` adresini aç. Üstteki **ADMİN**
   sekmesinden `.env`'e yazdığın (veya terminalde basılan) anahtarla giriş yap.

## GitHub'a public olarak atarken dikkat

Bu repo **public**, bu yüzden hiçbir gerçek şifre kod içinde veya
`.env.example`'da tutulmuyor — hepsi placeholder. `.gitignore` şunları
zaten dışarıda bırakıyor:

- `.env` (gerçek RCON şifresi ve admin key burada)
- `server.properties` (gerçek sunucu adresin, portların, rcon şifren)
- `node_modules/`

Yani `git add .` yapsan bile bu dosyalar repoya girmez. Sunucuna
kuracağın `server.properties` ve `.env` dosyalarını GitHub'a hiç atmadan,
sadece kendi sunucu makinende / bilgisayarında tut.

## server.properties

Bu dosyayı repoya **eklemiyoruz** (yukarıdaki sebepten), ama sana ayrı
bir dosya olarak veriyorum — Minecraft sunucunun kök klasörüne koyup
üzerine yaz. Yaptığım düzeltmeler:

- `rcon.password` yeni bir değere çevrildi. **Sohbette daha önce paylaşılan
  şifreleri artık kullanma**, onlar güvenli sayılmaz.
- `server-port` → `25566`'dan `25565`'e çevrildi (Minecraft'ın standart
  portu; `query.port` zaten `25565` idi, ikisinin farklı olması
  bağlantı sorunlarına yol açabiliyordu).
- `motd` ve `server-name` → "Hovanetwork" olarak güncellendi.
- `enable-rcon=true` zaten açıktı, dokunmadım.

Sunucuyu yeniden başlatman gerekiyor ki yeni `server.properties` devreye girsin.
`.env` dosyandaki `RCON_PASSWORD`'ü de bu dosyadaki `rcon.password` ile
aynı yapmayı unutma.

## "server.js çalışmıyor" sorunu için

Yeni `server.js` artık başlarken:
- `public/site.html` var mı diye kontrol ediyor ve yoksa terminalde açıkça söylüyor,
- RCON'a bağlanmayı deniyor ve sonucu terminale yazdırıyor (`[OK]` ya da `[UYARI] ...`),
- Port zaten kullanılıyorsa (`EADDRINUSE`) anlamlı bir hata basıp çıkıyor,
- RCON hatalarını (yanlış şifre / kapalı sunucu / firewall) Türkçe açıklamaya çeviriyor.

`npm start` ile çalıştırıp terminalde ne yazdığını görürsen sorunun tam
olarak ne olduğunu anlarız (örn. "RCON bağlantısı reddedildi" → sunucu
kapalı ya da port yanlış; "kimlik doğrulaması başarısız" → şifre uyuşmuyor).

## Önemli güvenlik notları

- Bu dosyaları paylaştığın her yerde (GitHub dahil) `ADMIN_KEY` ve
  `rcon.password` görünür hale gelir. Herkese açık bir yere koyacaksan
  ikisini de tekrar değiştir.
- `enable-rcon=true` olduğu için `25575` portu mümkünse sadece bu
  panelin çalıştığı makineden erişilebilir olacak şekilde firewall'da
  kısıtlanmalı.

## Uç noktalar (endpoints)

| Yöntem | Yol            | Açıklama                                | Korumalı mı |
|--------|----------------|------------------------------------------|-------------|
| GET    | `/api/status`  | Sunucu çevrimiçi mi (online/offline)      | Hayır       |
| GET    | `/api/players` | `list` komutunun sonucu (oyuncu listesi)  | Evet        |
| POST   | `/api/command` | `{ "command": "..." }` ile RCON komutu    | Evet        |

Korumalı uç noktalar `x-admin-key` header'ı ister.
