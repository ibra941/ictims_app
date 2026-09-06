#!/usr/bin/env php
<?php
// ICTIMS System Diagnostic Script
// Run: php check-system.php

echo "\033[1;36m";
echo "========================================\n";
echo "   ICTIMS SYSTEM DIAGNOSTIC v2.0\n";
echo "========================================\n";
echo "\033[0m";

$hasError = false;
$warnings = [];
$errors = [];

// 1. Check PHP Version
echo "\n\033[1;33m1. PHP ENVIRONMENT:\033[0m\n";
echo "   PHP Version: " . phpversion() . "\n";
echo "   PHP SAPI: " . php_sapi_name() . "\n";
echo "   PHP Binary: " . PHP_BINARY . "\n";

// 2. Check Required PHP Extensions
echo "\n\033[1;33m2. PHP EXTENSIONS:\033[0m\n";
$required = ['pdo', 'pdo_mysql', 'mbstring', 'xml', 'json', 'openssl', 'tokenizer'];
foreach ($required as $ext) {
    $loaded = extension_loaded($ext);
    echo "   " . $ext . ": " . ($loaded ? "\033[32m✅ YES\033[0m" : "\033[31m❌ NO\033[0m") . "\n";
    if (!$loaded) $errors[] = "Extension '$ext' not loaded";
}

// 3. Check PHP Configuration
echo "\n\033[1;33m3. PHP CONFIGURATION:\033[0m\n";
$configs = [
    'output_buffering' => ini_get('output_buffering'),
    'display_errors' => ini_get('display_errors'),
    'error_reporting' => error_reporting(),
    'memory_limit' => ini_get('memory_limit'),
    'max_execution_time' => ini_get('max_execution_time') . 's',
];
foreach ($configs as $key => $value) {
    echo "   $key: " . ($value ?: 'OFF') . "\n";
}

// 4. Headers Status
echo "\n\033[1;33m4. HEADERS STATUS:\033[0m\n";
if (headers_sent($file, $line)) {
    echo "   \033[31m❌ Headers already sent in: $file at line: $line\033[0m\n";
    $errors[] = "Headers already sent in $file at line $line";
} else {
    echo "   \033[32m✅ No headers sent yet\033[0m\n";
}

// 5. Check Laravel Files
echo "\n\033[1;33m5. LARAVEL FILES:\033[0m\n";
$files = [
    'vendor/autoload.php' => 'Vendor autoload',
    '.env' => 'Environment file',
    'public/index.php' => 'Public index',
    'artisan' => 'Artisan CLI',
    'bootstrap/app.php' => 'Bootstrap app',
];
foreach ($files as $file => $desc) {
    $exists = file_exists($file);
    echo "   " . $desc . ": " . ($exists ? "\033[32m✅ EXISTS\033[0m" : "\033[31m❌ MISSING\033[0m") . "\n";
    if (!$exists) $errors[] = "File '$file' missing";
}

// 6. Check .env Variables
echo "\n\033[1;33m6. ENVIRONMENT VARIABLES:\033[0m\n";
if (file_exists('.env')) {
    $env = file_get_contents('.env');
    $vars = ['DB_CONNECTION', 'DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USERNAME', 'APP_KEY', 'APP_URL'];
    foreach ($vars as $var) {
        if (preg_match('/^' . $var . '=([^\n]+)/m', $env, $matches)) {
            $value = trim($matches[1]);
            if ($var === 'APP_KEY') {
                $status = !empty($value) ? "\033[32mSET\033[0m" : "\033[31mNOT SET\033[0m";
            } else {
                $status = "\033[32m" . $value . "\033[0m";
            }
            echo "   $var: $status\n";
            if ($var === 'APP_KEY' && empty($value)) {
                $warnings[] = "APP_KEY is not set. Run: php artisan key:generate";
            }
        }
    }
} else {
    echo "   \033[31m❌ .env NOT FOUND\033[0m\n";
    $errors[] = ".env file not found";
}

// 7. Check Storage Permissions
echo "\n\033[1;33m7. STORAGE PERMISSIONS:\033[0m\n";
$dirs = [
    'storage',
    'bootstrap/cache',
    'storage/framework/sessions',
    'storage/framework/views',
    'storage/framework/cache',
];
foreach ($dirs as $dir) {
    if (is_dir($dir)) {
        $writable = is_writable($dir);
        echo "   $dir: " . ($writable ? "\033[32m✅ WRITABLE\033[0m" : "\033[31m❌ NOT WRITABLE\033[0m") . "\n";
        if (!$writable) $errors[] = "Directory '$dir' is not writable";
    } else {
        echo "   $dir: \033[33m⚠️ DOES NOT EXIST\033[0m\n";
    }
}

// 8. Check for BOM (Byte Order Mark)
echo "\n\033[1;33m8. CHECKING FOR BOM:\033[0m\n";
$phpFiles = [
    'public/index.php',
    'routes/web.php',
    'routes/api.php',
    'bootstrap/app.php',
    'app/Http/Controllers/DashboardController.php',
    'app/Http/Controllers/DiagnosticController.php',
];
$bomFound = false;
foreach ($phpFiles as $file) {
    if (file_exists($file)) {
        $content = file_get_contents($file);
        if (substr($content, 0, 3) === "\xEF\xBB\xBF") {
            echo "   \033[31m❌ BOM found in: $file\033[0m\n";
            $bomFound = true;
            $errors[] = "BOM found in $file";
        } else {
            echo "   ✅ No BOM in: $file\n";
        }
    }
}
if (!$bomFound) echo "   \033[32m✅ No BOM found in checked files\033[0m\n";

// 9. Check for Whitespace before <?php
echo "\n\033[1;33m9. CHECKING FOR WHITESPACE:\033[0m\n";
$whitespaceFound = false;
foreach ($phpFiles as $file) {
    if (file_exists($file)) {
        $content = file_get_contents($file);
        if (trim($content) !== $content) {
            echo "   \033[33m⚠️ Whitespace before/after <?php in: $file\033[0m\n";
            $whitespaceFound = true;
            $warnings[] = "Whitespace found in $file";
        }
    }
}
if (!$whitespaceFound) echo "   \033[32m✅ No whitespace issues found\033[0m\n";

// 10. Check Vendor Directory
echo "\n\033[1;33m10. VENDOR DIRECTORY:\033[0m\n";
if (is_dir('vendor')) {
    echo "   ✅ Vendor directory exists\n";
    // Check a few key packages
    $packages = [
        'vendor/symfony/http-foundation/Response.php',
        'vendor/laravel/framework/src/Illuminate/Foundation/Application.php',
    ];
    foreach ($packages as $package) {
        if (file_exists($package)) {
            echo "   ✅ " . basename(dirname(dirname($package))) . "/" . basename(dirname($package)) . ": EXISTS\n";
        } else {
            echo "   \033[31m❌ " . basename(dirname(dirname($package))) . "/" . basename(dirname($package)) . ": MISSING\033[0m\n";
            $errors[] = "Package " . basename(dirname(dirname($package))) . " missing";
        }
    }
} else {
    echo "   \033[31m❌ Vendor directory MISSING\033[0m\n";
    echo "   \033[33mRun: composer install\033[0m\n";
    $errors[] = "Vendor directory missing";
}

// 11. Test Database Connection
echo "\n\033[1;33m11. DATABASE CONNECTION:\033[0m\n";
if (file_exists('.env')) {
    try {
        $env = parse_ini_file('.env');
        if (isset($env['DB_CONNECTION']) && $env['DB_CONNECTION'] === 'mysql') {
            $host = $env['DB_HOST'] ?? '127.0.0.1';
            $port = $env['DB_PORT'] ?? '3306';
            $dbname = $env['DB_DATABASE'] ?? 'laravel';
            $user = $env['DB_USERNAME'] ?? 'root';
            $pass = $env['DB_PASSWORD'] ?? '';
            
            try {
                $pdo = new PDO("mysql:host=$host;port=$port", $user, $pass);
                echo "   ✅ MySQL connection successful\n";
                try {
                    $pdo->query("USE `$dbname`");
                    echo "   ✅ Database '$dbname' exists\n";
                    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
                    echo "   ✅ Tables found: " . count($tables) . "\n";
                } catch (PDOException $e) {
                    echo "   \033[33m⚠️ Database '$dbname' not found or inaccessible\033[0m\n";
                    $warnings[] = "Database '$dbname' not found";
                }
            } catch (PDOException $e) {
                echo "   \033[31m❌ MySQL Connection failed: " . $e->getMessage() . "\033[0m\n";
                $errors[] = "MySQL connection failed";
            }
        }
    } catch (Exception $e) {
        echo "   \033[33m⚠️ Could not parse .env file\033[0m\n";
    }
}

// 12. Check Node Modules
echo "\n\033[1;33m12. FRONTEND DEPENDENCIES:\033[0m\n";
if (file_exists('node_modules')) {
    echo "   ✅ node_modules exists\n";
    $packages = ['react', 'react-dom', 'axios', 'vite'];
    foreach ($packages as $pkg) {
        if (file_exists("node_modules/$pkg")) {
            echo "   ✅ $pkg: INSTALLED\n";
        } else {
            echo "   \033[33m⚠️ $pkg: NOT INSTALLED\033[0m\n";
            $warnings[] = "npm package '$pkg' not installed";
        }
    }
} else {
    echo "   \033[33m⚠️ node_modules not found\033[0m\n";
    echo "   \033[33mRun: npm install\033[0m\n";
}

// 13. Check Compiled Assets
echo "\n\033[1;33m13. COMPILED ASSETS:\033[0m\n";
if (file_exists('public/build')) {
    echo "   ✅ public/build exists\n";
    $assets = glob('public/build/assets/*.{js,css}', GLOB_BRACE);
    echo "   ✅ Assets found: " . count($assets) . "\n";
} else {
    echo "   \033[33m⚠️ public/build not found\033[0m\n";
    echo "   \033[33mRun: npm run build\033[0m\n";
}

// 14. Summary
echo "\n\033[1;36m";
echo "========================================\n";
echo "   DIAGNOSTIC SUMMARY\n";
echo "========================================\033[0m\n";

if (empty($errors) && empty($warnings)) {
    echo "\033[32m✅ All checks passed! Your system is ready.\033[0m\n";
} else {
    if (!empty($errors)) {
        echo "\n\033[31m❌ ERRORS FOUND (" . count($errors) . "):\033[0m\n";
        foreach ($errors as $i => $error) {
            echo "   " . ($i + 1) . ". $error\n";
        }
    }
    if (!empty($warnings)) {
        echo "\n\033[33m⚠️ WARNINGS (" . count($warnings) . "):\033[0m\n";
        foreach ($warnings as $i => $warning) {
            echo "   " . ($i + 1) . ". $warning\n";
        }
    }
    echo "\n\033[1;33mRECOMMENDED FIXES:\033[0m\n";
    if (in_array("APP_KEY is not set", $warnings)) {
        echo "   php artisan key:generate\n";
    }
    if (in_array("Vendor directory missing", $errors)) {
        echo "   composer install\n";
    }
    if (in_array("Headers already sent", $errors)) {
        echo "   Remove BOM: find . -name '*.php' -exec sed -i '1s/^\\xEF\\xBB\\xBF//' {} \\;\n";
    }
    if (in_array("Directory 'storage' is not writable", $errors)) {
        echo "   sudo chmod -R 777 storage bootstrap/cache\n";
    }
    if (in_array("Database 'ictims' not found", $warnings)) {
        echo "   Create database: mysql -u root -p -e 'CREATE DATABASE ictims;'\n";
    }
}

echo "\n\033[1;36m========================================\n\033[0m";
