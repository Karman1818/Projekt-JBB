<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Credentials: true");

require_once 'config.php';

try {
    if (!isset($_GET['payer_id']) || !is_numeric($_GET['payer_id'])) {
        echo json_encode(["error" => "Brak lub nieprawidłowe ID płatnika"]);
        exit;
    }

    $payer_id = (int)$_GET['payer_id'];

    $sql = "SELECT id, nazwa AS firma
            FROM pozostali_dostawcy
            WHERE kontrahent_id = ?
            ORDER BY nazwa ASC";

    $stmt = $conn->prepare($sql);
    $stmt->execute([$payer_id]);

    $suppliers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$suppliers) {
        echo json_encode([]);
        exit;
    }

    echo json_encode($suppliers, JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "error" => "Błąd bazy danych: " . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
