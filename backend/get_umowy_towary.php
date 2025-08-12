<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
session_start();

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
            ut.id AS mapping_id,
            ut.umowy_id,
            ut.towar_id,
            ut.ilosc AS ilosc_mapowania,
            t.produkt,
            t.rabat,
            t.cena_realizacji,
            t.ilosc_estymowana,
            t.created_at AS produkt_created_at,
            t.updated_at AS produkt_updated_at,
            u.id AS umowa_id,
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
        FROM umowy_towary ut
        JOIN towary t ON t.id = ut.towar_id
        JOIN umowy_porozumien u ON u.id = ut.umowy_id
        LEFT JOIN kontrahenci p ON u.wystawca_faktury = p.id
        LEFT JOIN pozostali_dostawcy d ON u.dostawca_id = d.id
        LEFT JOIN kontrahenci w ON u.wydawca_gazetki = w.id
        LEFT JOIN kontrahenci k ON u.kontrahent_id = k.id
        WHERE u.kontrahent_id = ?
        ORDER BY u.id ASC, ut.id ASC
    ";

    $stmt = $conn->prepare($sql);
    $stmt->execute([$kontrahent_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($rows, JSON_UNESCAPED_UNICODE);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Błąd podczas pobierania danych: ' . $e->getMessage()]);
    exit;
}
