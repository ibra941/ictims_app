<?php

echo "Testing .env loading...\n";
echo "========================\n\n";

// Load .env manually
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    echo "✅ .env file exists at: $envFile\n";
    $content = file_get_contents($envFile);
    echo "✅ File size: " . strlen($content) . " bytes\n";
    
    // Check for DB_ variables
    preg_match_all('/^DB_(.*?)=(.*)$/m', $content, $matches);
    echo "\n📋 DB_ variables found:\n";
    foreach ($matches[1] as $key => $name) {
        echo "   - DB_$name = " . trim($matches[2][$key]) . "\n";
    }
} else {
    echo "❌ .env file not found!\n";
}

echo "\n";
echo "PHP Environment:\n";
echo "----------------\n";
echo "DB_CONNECTION: " . (getenv('DB_CONNECTION') ?: 'NOT SET') . "\n";
echo "DB_HOST: " . (getenv('DB_HOST') ?: 'NOT SET') . "\n";
echo "DB_PORT: " . (getenv('DB_PORT') ?: 'NOT SET') . "\n";
echo "DB_DATABASE: " . (getenv('DB_DATABASE') ?: 'NOT SET') . "\n";
echo "DB_USERNAME: " . (getenv('DB_USERNAME') ?: 'NOT SET') . "\n";
echo "DB_PASSWORD: " . (getenv('DB_PASSWORD') ? 'SET (hidden)' : 'NOT SET') . "\n";
