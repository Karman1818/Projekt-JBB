<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Credentials: true");

require_once 'config.php';

try {
    // Pobieramy tylko płatników (czy_platnik = 1)
    $sql = "SELECT id, firma, wyroznik 
            FROM kontrahenci 
            WHERE czy_platnik = 1
            ORDER BY firma ASC";

    $stmt = $conn->prepare($sql);
    $stmt->execute();

    $payers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Sprawdzamy, czy są wyniki
    if (!$payers) {
        echo json_encode(["error" => "Brak płatników w bazie."]);
        exit;
    }

    echo json_encode($payers, JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Błąd bazy danych: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
