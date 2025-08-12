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
            u.id,
            u.data_zawarcia_umowy,
            u.rodzaj,
            u.oplata,
            u.rodzaj_oplaty,
            u.kwota_netto,
            p.firma AS wystawca_faktury,
            d.nazwa AS dostawca,
            w.firma AS wydawca_gazetki,
            u.uwagi,
            u.rodzaj_uslugi_marketingowej,
            u.termin_obowiazywania_promocji_od,
            u.termin_obowiazywania_promocji_do,
            u.zatowarowanie_dystrybucji_od,
            u.zatowarowanie_dystrybucji_do,
            u.zatowarowanie_sklepu_od,
            u.zatowarowanie_sklepu_do,
            k.firma AS kontrahent,
            u.kontrahent_id
        FROM umowy_porozumien u
        LEFT JOIN kontrahenci p ON u.wystawca_faktury = p.id
        LEFT JOIN pozostali_dostawcy d ON u.dostawca_id = d.id
        LEFT JOIN kontrahenci w ON u.wydawca_gazetki = w.id
        LEFT JOIN kontrahenci k ON u.kontrahent_id = k.id
        WHERE u.kontrahent_id = ?
    ";
    $stmt = $conn->prepare($sql);
    $stmt->execute([$kontrahent_id]);
    $agreements = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($agreements);
} catch (PDOException $e) {
    echo json_encode(['error' => 'Błąd podczas pobierania danych: ' . $e->getMessage()]);
}