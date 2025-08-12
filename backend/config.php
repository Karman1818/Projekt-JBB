<?php


$host = "mysql-jbb.ogicom.pl";
$dbname = "db100089841";
$username = "db100089841";
$password = "O6CnPafyfEUhY";
$options = array(
                // PDO::ATTR_PERSISTENT => true,
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"
            );

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname", $username, $password,$options);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}
?>

