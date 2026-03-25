# 🔥 Panduan Setup Firebase & Firestore

## 1. Struktur Collection Firestore

Buat collection berikut di Firestore Console (https://console.firebase.google.com):

### Collection: `users`
Dokumen dibuat otomatis saat register. Untuk mengubah role, edit field `role` secara manual.

| Field | Tipe | Contoh |
|-------|------|--------|
| `name` | string | "Ahmad Fauzi" |
| `email` | string | "ahmad@email.com" |
| `role` | string | `"admin"` atau `"anggota"` |
| `createdAt` | string | "2026-03-25T21:00:00.000Z" |

> **Mengubah Role:**  
> Buka Firestore Console → Collection `users` → Klik dokumen user → Ubah field `role` dari `"anggota"` menjadi `"admin"`.

### Collection: `surat`
| Field | Tipe | Contoh |
|-------|------|--------|
| `namaKegiatan` | string | "Rapat Kerja" |
| `nomorSurat` | string | "001/SK/III/2026" |
| `tipe` | string | `"masuk"` atau `"keluar"` |
| `linkSurat` | string | "https://drive.google.com/..." |
| `createdAt` | timestamp | (auto) |

### Collection: `transaksi`
| Field | Tipe | Contoh |
|-------|------|--------|
| `keterangan` | string | "Sponsor kegiatan" |
| `jenis` | string | `"pemasukan"` atau `"pengeluaran"` |
| `nominal` | number | 500000 |
| `createdAt` | timestamp | (auto) |

### Collection: `acara`
| Field | Tipe | Contoh |
|-------|------|--------|
| `namaKegiatan` | string | "Workshop AI" |
| `tanggal` | string | "2026-04-15" |
| `lokasi` | string | "Gedung A Lt. 3" |
| `jam` | string | "09:00" |
| `createdAt` | timestamp | (auto) |

---

## 2. Firestore Security Rules

Buka **Firestore Database → Rules**, lalu paste rules berikut:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Surat, Transaksi, Acara - semua authenticated user bisa read
    match /{collection}/{docId} {
      allow read: if request.auth != null;
      allow create, update, delete: if request.auth != null;
    }
  }
}
```

---

## 3. Aktifkan Firebase Authentication

1. Buka Firebase Console → **Authentication** → **Sign-in method**
2. Aktifkan **Email/Password**
3. User baru otomatis terdaftar saat register via website

---

## 4. Deploy ke GitHub Pages

1. Buat repository baru di GitHub
2. Upload semua file dari folder project ke repository
3. Buka **Settings → Pages → Source** → pilih `main` branch
4. Website akan live di `https://username.github.io/repo-name/`

> **Penting:** Pastikan `index.html` berada di root folder repository.
