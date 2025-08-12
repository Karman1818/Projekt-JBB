<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Credentials: true");

include 'config.php';

try {
    $stmt = $conn->prepare("
        SELECT 
            id, 
            firma, 
            email, 
            adres, 
            nip, 
            czy_platnik, 
            wyroznik, 
            created_at, 
            updated_at
        FROM kontrahenci
    ");
    $stmt->execute();
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Zamiana czy_platnik na boolean
    foreach ($result as &$row) {
        $row['czy_platnik'] = (bool)$row['czy_platnik'];
    }

    echo json_encode($result, JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    echo json_encode([
        "error" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
