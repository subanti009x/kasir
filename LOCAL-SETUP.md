# Setup lokal (Windows)

Semua runtime aplikasi, package, cache, database, log, dan temporary files untuk setup ini berada di `F:\sir`.

## Menjalankan

Di PowerShell:

```powershell
Set-Location F:\sir
.\Start-Local.ps1
```

Buka `http://localhost:3001`. API dan dokumentasi tersedia di `http://localhost:3000/api/docs`.

## Akun contoh

- Pemilik toko: `ayu@nusantarabakery.com` / `owner123`
- Super admin: `admin@kasirpro.com` / `admin123`
- Kasir: `raka@nusantarabakery.com` / `cashier123`

## Menghentikan

```powershell
Set-Location F:\sir
.\Stop-Local.ps1
```

Log aplikasi ada di `.logs`. Data PostgreSQL ada di `.data\postgres` dan tetap tersimpan setelah layanan dihentikan. Basis data lokal memakai autentikasi trust yang hanya mendengarkan di `127.0.0.1`; jangan mengubah listen address untuk jaringan publik. Kredensial dan JWT secret di sini hanya untuk pemakaian lokal.
