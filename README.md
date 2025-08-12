🚀 Uruchomienie projektu (React + PHP + XAMPP)
1️⃣ Wymagania
Node.js (zalecane LTS) – pobierz

npm (instaluje się z Node.js)

XAMPP – pobierz

Przeglądarka (np. Chrome)

2️⃣ Uruchomienie Backend (PHP + XAMPP)
Uruchom XAMPP i włącz:

Apache

(opcjonalnie) MySQL – jeśli aplikacja korzysta z bazy

Skopiuj folder z backendem do katalogu:

makefile
Kopiuj
Edytuj
C:\xampp\htdocs\nazwa_folderu
Wejdź w przeglądarce na:

arduino
Kopiuj
Edytuj
http://localhost/nazwa_folderu
Jeśli jest plik config.php, dostosuj ustawienia bazy danych (host, user, password, dbname).

3️⃣ Uruchomienie Frontendu (React + npm)
Wejdź w folder z frontendem:

bash
Kopiuj
Edytuj
cd sciezka/do/frontendu
Zainstaluj zależności:

bash
Kopiuj
Edytuj
npm install
Uruchom aplikację developerską:

bash
Kopiuj
Edytuj
npm run dev
W terminalu zobaczysz link (np.):

arduino
Kopiuj
Edytuj
http://localhost:5173
Otwórz go w przeglądarce.

4️⃣ Struktura projektu
bash
Kopiuj
Edytuj
projekt/
│
├── backend/        # PHP + API
│   └── index.php
│
└── frontend/       # React + Vite
    ├── src/
    └── package.json
5️⃣ Uwagi
Frontend może wymagać zmiany adresu API w kodzie (fetch, axios) na:

arduino
Kopiuj
Edytuj
http://localhost/nazwa_folderu
Jeśli jest problem z CORS, upewnij się, że w backendzie są ustawione nagłówki:

php
Kopiuj
Edytuj
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
XAMPP musi być uruchomiony przed korzystaniem z backendu.
