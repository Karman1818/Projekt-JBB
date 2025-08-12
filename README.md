# 🚀 Uruchomienie projektu (React + PHP + XAMPP)

## 1️⃣ Wymagania
- **Node.js** (zalecane LTS) – [pobierz](https://nodejs.org/)
- **npm** (instaluje się razem z Node.js)
- **XAMPP** – [pobierz](https://www.apachefriends.org/pl/index.html)
- Przeglądarka internetowa (np. Chrome)

---

## 2️⃣ Uruchomienie Backend (PHP + XAMPP)

1. **Uruchom XAMPP** i włącz:
   - `Apache`
   - (opcjonalnie) `MySQL` – jeśli aplikacja korzysta z bazy danych
2. **Backend MUSI znajdować się w katalogu `htdocs`** w folderze XAMPP, np.:
   ```
   C:\xampp\htdocs\nazwa_folderu
   ```
3. Wejdź w przeglądarce na:
   ```
   http://localhost/nazwa_folderu
   ```
4. Jeśli jest plik `config.php`, dostosuj ustawienia bazy danych (`host`, `user`, `password`, `dbname`).

---

## 3️⃣ Uruchomienie Frontendu (React + npm)

1. Wejdź w folder z frontendem:
   ```bash
   cd sciezka/do/frontendu
   ```
2. Zainstaluj zależności:
   ```bash
   npm install
   ```
3. Uruchom aplikację developerską:
   ```bash
   npm run dev
   ```
4. W terminalu pojawi się adres (np.):
   ```
   http://localhost:5173
   ```
   Otwórz go w przeglądarce.

---

## 4️⃣ Struktura projektu
```
projekt/
│
├── backend/        # PHP + API (umieszczony w C:\xampp\htdocs)
│   └── index.php
│
└── frontend/       # React + Vite
    ├── src/
    └── package.json
```

---

## 5️⃣ Uwagi
- Frontend może wymagać zmiany adresu API w kodzie (`fetch`, `axios`) na:
  ```
  http://localhost/nazwa_folderu
  ```
- Jeśli występuje problem z CORS, w backendzie dodaj nagłówki:
  ```php
  header("Access-Control-Allow-Origin: http://localhost:5173");
  header("Access-Control-Allow-Credentials: true");
  ```
- XAMPP musi być uruchomiony **przed** korzystaniem z backendu.
