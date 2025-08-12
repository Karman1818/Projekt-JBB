<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'config.php';

$kontrahent_id = isset($_GET['kontrahent_id']) ? (int)$_GET['kontrahent_id'] : null;
if (!$kontrahent_id) {
    echo json_encode(['error' => 'Brak kontrahent_id']);
    exit;
}

try {
    $sql = "
        SELECT
            t.id,
            t.produkt,
            t.rabat,
            t.cena_realizacji,
            t.ilosc_estymowana,
            ut.ilosc AS ilosc_w_umowie,
            u.id AS umowa_id,
            t.created_at,
            t.updated_at
        FROM towary t
        INNER JOIN umowy_towary ut ON ut.towar_id = t.id
        INNER JOIN umowy_porozumien u ON ut.umowy_id = u.id
        WHERE u.kontrahent_id = ?
    ";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$kontrahent_id]);
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // rzutowanie typów
    foreach ($products as &$row) {
        $row['rabat'] = $row['rabat'] !== null ? (float)$row['rabat'] : null;
        $row['cena_realizacji'] = isset($row['cena_realizacji']) ? (float)$row['cena_realizacji'] : 0.0;
        $row['ilosc_estymowana'] = isset($row['ilosc_estymowana']) ? (int)$row['ilosc_estymowana'] : 0;
        $row['ilosc_w_umowie'] = isset($row['ilosc_w_umowie']) ? (int)$row['ilosc_w_umowie'] : 0;
        $row['umowa_id'] = isset($row['umowa_id']) ? (int)$row['umowa_id'] : null;
    }
    unset($row);

    echo json_encode($products, JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Błąd podczas pobierania danych: ' . $e->getMessage()]);
}
?>
