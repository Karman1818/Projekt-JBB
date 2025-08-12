<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);


ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1); 
ini_set('session.use_strict_mode', 1);

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

session_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'config.php';

// Pobranie danych
$data = json_decode(file_get_contents("php://input"), true);
$email = filter_var($data['email'] ?? null, FILTER_SANITIZE_EMAIL);
$password = $data['password'] ?? null;

if (!$email || !$password || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["error" => "Email i hasło są wymagane lub nieprawidłowy format email"]);
    exit();
}

try {
    $sql = "SELECT id, haslo, kontrahent_id FROM uzytkownicy WHERE email = :email";
    $stmt = $conn->prepare($sql);
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['haslo'])) {
        // Zapis do sesji
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['email'] = $email;
        $_SESSION['kontrahent_id'] = $user['kontrahent_id'];

        session_regenerate_id(true);

        // Generowanie tokena 
        $payload = [
            "id" => $user['id'],
            "email" => $email,
            "kontrahent_id" => $user['kontrahent_id'],
            "iat" => time(),
            "exp" => time() + (60 * 60) 
        ];
        $secret = "twoj_tajny_klucz";
        $token = base64_encode(json_encode($payload)); 

        echo json_encode([
            "token" => $token,
            "message" => "Logowanie udane",
            "user" => $payload
        ]);
    } else {
        echo json_encode(["error" => "Nieprawidłowy email lub hasło"]);
    }
} catch (PDOException $e) {
    error_log($e->getMessage(), 3, '/var/log/php_errors.log');
    echo json_encode(["error" => "Wystąpił błąd serwera"]);
}