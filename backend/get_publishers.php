<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Credentials: true");

include 'config.php';

try {
    $stmt = $conn->prepare("SELECT id, firma FROM kontrahenci WHERE wyroznik = 'SKLEP'");
    $stmt->execute();
    $publishers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($publishers);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Błąd bazy danych: " . $e->getMessage()]);
}
?>