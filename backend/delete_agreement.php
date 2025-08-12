<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'config.php';

$input = json_decode(file_get_contents('php://input'), true);

$id = isset($input['id']) ? (int)$input['id'] : null;
$kontrahent_id = isset($input['kontrahent_id']) ? (int)$input['kontrahent_id'] : null;

if (!$id || !$kontrahent_id) {
    echo json_encode(['error' => 'Brak id lub kontrahent_id']);
    exit;
}

try {
    // zaczynamy transakcję
    $conn->beginTransaction();

    // pobierz wszystkie towar_id powiązane z tą umową
    $stmt = $conn->prepare("SELECT towar_id FROM umowy_towary WHERE umowy_id = ?");
    $stmt->execute([$id]);
    $towary = $stmt->fetchAll(PDO::FETCH_COLUMN, 0); 

    // usuń powiązania z umowy_towary
    $stmt = $conn->prepare("DELETE FROM umowy_towary WHERE umowy_id = ?");
    $stmt->execute([$id]);

    // usuń samą umowę (tylko jeśli należy do kontrahenta)
    $stmt = $conn->prepare("DELETE FROM umowy_porozumien WHERE id = ? AND kontrahent_id = ?");
    $stmt->execute([$id, $kontrahent_id]);

    if ($stmt->rowCount() === 0) {
        // nie usunięto umowy (np. brak uprawnień / nie ma takiego id dla tego kontrahenta)
        $conn->rollBack();
        echo json_encode(['error' => 'Nie znaleziono umowy lub brak uprawnień/zgodności kontrahent_id.']);
        exit;
    }

    // dla każdego pobranego towar_id jeśli nie ma już żadnych powiązań w umowy_towary -> usuń towar
    if (!empty($towary)) {
        $checkStmt = $conn->prepare("SELECT COUNT(*) FROM umowy_towary WHERE towar_id = ?");
        $deleteTowarStmt = $conn->prepare("DELETE FROM towary WHERE id = ?");
        foreach ($towary as $towar_id) {
            // policz, ile powiązań pozostało
            $checkStmt->execute([$towar_id]);
            $cnt = (int)$checkStmt->fetchColumn();
            if ($cnt === 0) {
                // usuń towar, bo nie jest już powiązany z żadną umową
                $deleteTowarStmt->execute([$towar_id]);
            }
        }
    }

    // zatwierdzamy transakcję
    $conn->commit();

    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    // w razie błędu wycofujemy wszystko i zwracamy błąd
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    echo json_encode(['error' => 'Błąd przy usuwaniu: ' . $e->getMessage()]);
}
?>
