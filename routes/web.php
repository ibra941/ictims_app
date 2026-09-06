<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'status' => 'success',
        'message' => 'ICTIMS Backend API is running perfectly',
        'frontend_url' => 'http://localhost:5173'
    ]);
});

Route::fallback(function () {
    return response()->json([
        'status' => 'error',
        'message' => 'This is a backend API. Please use the frontend at http://localhost:5173',
        'requested_url' => url()->current()
    ]);
});
