<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Content-Type: application/json");

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    echo json_encode(["message" => "OK"]);
    exit();
}

include 'config.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["error" => "Niepoprawny format danych wejściowych"]);
    exit();
}

$firstName = $data['firstName'] ?? null;
$lastName = $data['lastName'] ?? null;
$email = $data['email'] ?? null;
$password = $data['password'] ?? null;
$kontrahentId = isset($data['kontrahent_id']) ? (int)$data['kontrahent_id'] : null;

if (!$firstName || !$lastName || !$email || !$password || !$kontrahentId) {
    echo json_encode(["error" => "Wszystkie pola są wymagane"]);
    exit();
}

try {
    $sql = "INSERT INTO uzytkownicy (imie, nazwisko, email, haslo, kontrahent_id) 
            VALUES (:imie, :nazwisko, :email, :haslo, :kontrahent_id)";
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        'imie' => $firstName,
        'nazwisko' => $lastName,
        'email' => $email,
        'haslo' => password_hash($password, PASSWORD_DEFAULT),
        'kontrahent_id' => $kontrahentId
    ]);

    echo json_encode(["message" => "Użytkownik został dodany pomyślnie"]);
} catch (PDOException $e) {
    echo json_encode(["error" => "Błąd bazy danych: " . $e->getMessage()]);
}
?>
