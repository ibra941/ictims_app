<?php
// Minimal test - no Laravel
header('Content-Type: application/json');
echo json_encode(['status' => 'ok', 'message' => 'Minimal test works']);
