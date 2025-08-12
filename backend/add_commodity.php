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

// Pobieranie i walidacja danych
$requiredFields = [
    'produkt',
    'cena_realizacji',
    'ilosc_estymowana',
    'umowy_id',
    'ilosc'
];

foreach ($requiredFields as $field) {
    if (!isset($data[$field])) {
        http_response_code(400);
        echo json_encode(["error" => "Brak wymaganego pola: $field"]);
        exit();
    }
}

// Walidacja specyficznych pól
$produkt = $data['produkt'];
if (empty($produkt) || strlen($produkt) > 255) {
    http_response_code(400);
    echo json_encode(["error" => "Pole 'produkt' musi być niepuste i mieć maksymalnie 255 znaków"]);
    exit();
}

$cena_realizacji = $data['cena_realizacji'];
if (!is_numeric($cena_realizacji) || $cena_realizacji < 0) {
    http_response_code(400);
    echo json_encode(["error" => "Pole 'cena_realizacji' musi być liczbą nieujemną"]);
    exit();
}

$ilosc_estymowana = $data['ilosc_estymowana'];
if (!is_numeric($ilosc_estymowana) || $ilosc_estymowana <= 0 || floor($ilosc_estymowana) != $ilosc_estymowana) {
    http_response_code(400);
    echo json_encode(["error" => "Pole 'ilosc_estymowana' musi być dodatnią liczbą całkowitą"]);
    exit();
}

$umowy_id = $data['umowy_id'];
if (!is_numeric($umowy_id) || $umowy_id <= 0 || floor($umowy_id) != $umowy_id) {
    http_response_code(400);
    echo json_encode(["error" => "Pole 'umowy_id' musi być dodatnią liczbą całkowitą"]);
    exit();
}

$ilosc = $data['ilosc'];
if (!is_numeric($ilosc) || $ilosc <= 0 || floor($ilosc) != $ilosc) {
    http_response_code(400);
    echo json_encode(["error" => "Pole 'ilosc' musi być dodatnią liczbą całkowitą"]);
    exit();
}

$rabat = $data['rabat'] ?? null;
if ($rabat !== null && (!is_numeric($rabat) || $rabat < 0)) {
    http_response_code(400);
    echo json_encode(["error" => "Pole 'rabat' musi być liczbą nieujemną lub null"]);
    exit();
}

// Walidacja istnienia umowy
$try = $conn->prepare("SELECT id FROM umowy_porozumien WHERE id = :id");
$try->execute(['id' => $umowy_id]);
if (!$try->fetch()) {
    http_response_code(400);
    echo json_encode(["error" => "Nieprawidłowy umowy_id. Umowa nie istnieje"]);
    exit();
}

try {
    // Rozpoczęcie transakcji
    $conn->beginTransaction();

    // Wstawienie produktu do tabeli towary
    $sql_towary = "INSERT INTO towary (
        produkt, rabat, cena_realizacji, ilosc_estymowana
    ) VALUES (
        :produkt, :rabat, :cena_realizacji, :ilosc_estymowana
    )";

    $stmt_towary = $conn->prepare($sql_towary);
    $stmt_towary->execute([
        'produkt' => $produkt,
        'rabat' => $rabat,
        'cena_realizacji' => $cena_realizacji,
        'ilosc_estymowana' => $ilosc_estymowana
    ]);

    // Pobranie ID nowo utworzonego produktu
    $towar_id = $conn->lastInsertId();

    // Wstawienie rekordu do umowy_towary
    $sql_umowy_towary = "INSERT INTO umowy_towary (
        umowy_id, towar_id, ilosc
    ) VALUES (
        :umowy_id, :towar_id, :ilosc
    )";

    $stmt_umowy_towary = $conn->prepare($sql_umowy_towary);
    $stmt_umowy_towary->execute([
        'umowy_id' => $umowy_id,
        'towar_id' => $towar_id,
        'ilosc' => $ilosc
    ]);

    // Zatwierdzenie transakcji
    $conn->commit();

    http_response_code(201);
    echo json_encode(["message" => "Produkt i powiązanie z umową zostały dodane pomyślnie"]);
} catch (PDOException $e) {
    // Wycofanie transakcji w przypadku błędu
    $conn->rollBack();
    http_response_code(500);
    echo json_encode(["error" => "Błąd bazy danych: " . $e->getMessage()]);
}
?>