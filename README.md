# Hovanetwork Panel

## Kurulum
```
npm install
node server.js
```
Sonra tarayıcıda `http://localhost:3000` adresini aç.

## Notlar
- RCON bilgileri `server.js` içinde `RCON_HOST`, `RCON_PORT`, `RCON_PASSWORD` değişkenlerinde, server.properties'ten alındı (port: 25575).
- RCON'un Minecraft sunucusu ile **aynı makinede** çalıştığını varsaydım (`127.0.0.1`). Farklı bir makinede çalıştırıyorsan `RCON_HOST` değerini sunucunun IP'siyle değiştir ve `server.properties` içinde rcon'a dışarıdan erişime izin ver.
- Panel giriş şifresi `public/index.html` içinde `LOGIN_PASSWORD` değişkeninde (`hovanetwork2026`), istediğin gibi değiştirebilirsin. Bu şifre sadece tarayıcı tarafında kontrol ediliyor, gerçek güvenlik için backend'e taşınması önerilir.
- Rank verme komutu `lp user <isim> parent add <rank>` (LuckPerms) olarak ayarlandı. Farklı bir yetki eklentisi kullanıyorsan `server.js` içindeki `command` satırını değiştir.
- Burada gerçek bir ödeme sistemi yok, buton doğrudan rankı veriyor. Gerçek satış için bir ödeme altyapısı (iyzico, PayTR vb.) entegre etmen gerekir.
