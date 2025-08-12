<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["message" => "OK"]);
    exit();
}

include 'config.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["error" => "Niepoprawny format danych wejściowych"]);
    exit();
}

// Wymagane pola
$requiredFields = [
    'data_zawarcia_umowy',
    'rodzaj',
    'oplata',
    'wystawca_faktury',
    'wydawca_gazetki',
    'rodzaj_uslugi_marketingowej',
    'termin_obowiazywania_promocji_od',
    'termin_obowiazywania_promocji_do',
    'zatowarowanie_dystrybucji_od',
    'zatowarowanie_dystrybucji_do',
    'wysylka_porozumienia',
    'kontrahent_id'
];

foreach ($requiredFields as $field) {
    if (!isset($data[$field])) {
        http_response_code(400);
        echo json_encode(["error" => "Brak wymaganego pola: $field"]);
        exit();
    }
}

// Walidacja wartości
$rodzaj = $data['rodzaj'];
if (!in_array($rodzaj, ['Hurtowe', 'Detaliczne'])) {
    http_response_code(400);
    echo json_encode(["error" => "Nieprawidłowa wartość pola 'rodzaj'. Dozwolone: Hurtowe, Detaliczne"]);
    exit();
}

$oplata = filter_var($data['oplata'], FILTER_VALIDATE_BOOLEAN);
$rodzaj_oplaty = $data['rodzaj_oplaty'] ?? null;
$kwota_netto = $data['kwota_netto'] ?? null;

if ($oplata) {
    if (!$rodzaj_oplaty || $kwota_netto === null || !is_numeric($kwota_netto) || $kwota_netto < 0) {
        http_response_code(400);
        echo json_encode(["error" => "Jeśli oplata=true, pola rodzaj_oplaty i kwota_netto muszą być podane i poprawne"]);
        exit();
    }
} else {
    if ($rodzaj_oplaty !== null || $kwota_netto !== null) {
        http_response_code(400);
        echo json_encode(["error" => "Jeśli oplata=false, pola rodzaj_oplaty i kwota_netto muszą być null"]);
        exit();
    }
}

// Walidacja kontrahentów
$wystawca_faktury = $data['wystawca_faktury'];
$try = $conn->prepare("SELECT id FROM kontrahenci WHERE id = :id AND czy_platnik = TRUE");
$try->execute(['id' => $wystawca_faktury]);
if (!$try->fetch()) {
    http_response_code(400);
    echo json_encode(["error" => "Nieprawidłowy wystawca_faktury. Kontrahent musi mieć czy_platnik=true"]);
    exit();
}

$wydawca_gazetki = $data['wydawca_gazetki'];
$try = $conn->prepare("SELECT id FROM kontrahenci WHERE id = :id AND wyroznik = 'SKLEP'");
$try->execute(['id' => $wydawca_gazetki]);
if (!$try->fetch()) {
    http_response_code(400);
    echo json_encode(["error" => "Nieprawidłowy wydawca_gazetki. Kontrahent musi mieć wyroznik='SKLEP'"]);
    exit();
}

$kontrahent_id = $data['kontrahent_id'];
$try = $conn->prepare("SELECT id FROM kontrahenci WHERE id = :id");
$try->execute(['id' => $kontrahent_id]);
if (!$try->fetch()) {
    http_response_code(400);
    echo json_encode(["error" => "Nieprawidłowy kontrahent_id"]);
    exit();
}

// Walidacja dostawcy
$dostawca_id = $data['dostawca_id'] ?? null;
if ($dostawca_id !== null) {
    $try = $conn->prepare("SELECT id FROM kontrahenci WHERE id = :id");
    $try->execute(['id' => $dostawca_id]);
    if (!$try->fetch()) {
        http_response_code(400);
        echo json_encode(["error" => "Nieprawidłowy dostawca_id"]);
        exit();
    }
}

$rodzaj_uslugi_marketingowej = $data['rodzaj_uslugi_marketingowej'];
if (!in_array($rodzaj_uslugi_marketingowej, ['Reklama', 'Promocja', 'Kampania', 'Inne'])) {
    http_response_code(400);
    echo json_encode(["error" => "Nieprawidłowa wartość pola 'rodzaj_uslugi_marketingowej'. Dozwolone: Reklama, Promocja, Kampania, Inne"]);
    exit();
}

// Walidacja dat
$dateFields = [
    'data_zawarcia_umowy' => $data['data_zawarcia_umowy'],
    'termin_obowiazywania_promocji_od' => $data['termin_obowiazywania_promocji_od'],
    'termin_obowiazywania_promocji_do' => $data['termin_obowiazywania_promocji_do'],
    'zatowarowanie_dystrybucji_od' => $data['zatowarowanie_dystrybucji_od'],
    'zatowarowanie_dystrybucji_do' => $data['zatowarowanie_dystrybucji_do']
];

if (!empty($data['zatowarowanie_sklepu_od'])) {
    $dateFields['zatowarowanie_sklepu_od'] = $data['zatowarowanie_sklepu_od'];
}
if (!empty($data['zatowarowanie_sklepu_do'])) {
    $dateFields['zatowarowanie_sklepu_do'] = $data['zatowarowanie_sklepu_do'];
}

foreach ($dateFields as $fieldName => $date) {
    if (!DateTime::createFromFormat('Y-m-d', $date)) {
        http_response_code(400);
        echo json_encode(["error" => "Nieprawidłowy format daty w polu: $fieldName. Oczekiwany format: Y-m-d"]);
        exit();
    }
}

$wysylka_porozumienia = filter_var($data['wysylka_porozumienia'], FILTER_VALIDATE_BOOLEAN);
$uwagi = $data['uwagi'] ?? null;

// Zapis do bazy
try {
    $sql = "INSERT INTO umowy_porozumien (
        data_zawarcia_umowy, rodzaj, oplata, rodzaj_oplaty, kwota_netto,
        wystawca_faktury, dostawca_id, wydawca_gazetki, uwagi, rodzaj_uslugi_marketingowej,
        termin_obowiazywania_promocji_od, termin_obowiazywania_promocji_do,
        zatowarowanie_dystrybucji_od, zatowarowanie_dystrybucji_do,
        zatowarowanie_sklepu_od, zatowarowanie_sklepu_do,
        wysylka_porozumienia, kontrahent_id
    ) VALUES (
        :data_zawarcia_umowy, :rodzaj, :oplata, :rodzaj_oplaty, :kwota_netto,
        :wystawca_faktury, :dostawca_id, :wydawca_gazetki, :uwagi, :rodzaj_uslugi_marketingowej,
        :termin_obowiazywania_promocji_od, :termin_obowiazywania_promocji_do,
        :zatowarowanie_dystrybucji_od, :zatowarowanie_dystrybucji_do,
        :zatowarowanie_sklepu_od, :zatowarowanie_sklepu_do,
        :wysylka_porozumienia, :kontrahent_id
    )";

    $stmt = $conn->prepare($sql);
    $stmt->execute([
        'data_zawarcia_umowy' => $data['data_zawarcia_umowy'],
        'rodzaj' => $rodzaj,
        'oplata' => $oplata,
        'rodzaj_oplaty' => $rodzaj_oplaty,
        'kwota_netto' => $kwota_netto,
        'wystawca_faktury' => $wystawca_faktury,
        'dostawca_id' => $dostawca_id,
        'wydawca_gazetki' => $wydawca_gazetki,
        'uwagi' => $uwagi,
        'rodzaj_uslugi_marketingowej' => $rodzaj_uslugi_marketingowej,
        'termin_obowiazywania_promocji_od' => $data['termin_obowiazywania_promocji_od'],
        'termin_obowiazywania_promocji_do' => $data['termin_obowiazywania_promocji_do'],
        'zatowarowanie_dystrybucji_od' => $data['zatowarowanie_dystrybucji_od'],
        'zatowarowanie_dystrybucji_do' => $data['zatowarowanie_dystrybucji_do'],
        'zatowarowanie_sklepu_od' => $data['zatowarowanie_sklepu_od'] ?? null,
        'zatowarowanie_sklepu_do' => $data['zatowarowanie_sklepu_do'] ?? null,
        'wysylka_porozumienia' => $wysylka_porozumienia,
        'kontrahent_id' => $kontrahent_id
    ]);

    $umowy_id = $conn->lastInsertId();

    http_response_code(201);
    echo json_encode([
        "message" => "Porozumienie zostało dodane pomyślnie",
        "umowy_id" => $umowy_id
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Błąd bazy danych: " . $e->getMessage()]);
}
?>
