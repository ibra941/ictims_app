<?php
$host = '127.0.0.1';
$port = 3307;
$db = 'ictims';
$user = 'root';
$pass = 'elias@83';

echo "Testing connection to MySQL...\n";
echo "Host: $host, Port: $port\n";
echo "Database: $db\n";
echo "User: $user\n\n";

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "✅ Connection successful!\n\n";

    // Show tables
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables found:\n";
    foreach ($tables as $table) {
        echo "  - $table\n";
    }

    // Count assets
    $count = $pdo->query("SELECT COUNT(*) FROM assets")->fetchColumn();
    echo "\nAssets count: $count\n";

    // Count users
    $count = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    echo "Users count: $count\n";

} catch (PDOException $e) {
    echo "❌ Connection failed: " . $e->getMessage() . "\n";
    echo "\nTroubleshooting tips:\n";
    echo "1. Check if Docker is running: docker ps\n";
    echo "2. Check container status: docker ps | grep ictims-mariadb\n";
    echo "3. Check port mapping: docker port ictims-mariadb\n";
    echo "4. Try connecting from inside container:\n";
    echo "   docker exec -it ictims-mariadb mysql -u root -p'elias@83' -e 'SHOW DATABASES;'\n";
}
