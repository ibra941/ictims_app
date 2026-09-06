<?php
// Simple test to check for headers issue
echo "Step 1: PHP is working\n";

// Check for output buffering
echo "Step 2: Output buffering status: " . (ini_get('output_buffering') ? 'ON' : 'OFF') . "\n";

// Check if any headers were sent
if (headers_sent($file, $line)) {
    echo "Step 3: Headers already sent in file: $file at line: $line\n";
} else {
    echo "Step 3: No headers sent yet\n";
}

// Test setting a header
try {
    header('Content-Type: text/plain');
    echo "Step 4: Header set successfully\n";
} catch (Exception $e) {
    echo "Step 4: Failed to set header: " . $e->getMessage() . "\n";
}

echo "Step 5: Test complete\n";
