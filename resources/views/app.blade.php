<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name', 'Laravel') }}</title>
</head>
<body>
    <h1 style="text-align: center; font-family: sans-serif; margin-top: 50px;">
        ICTIMS Backend API is running successfully on Port 8003.
    </h1>
    <p style="text-align: center;">Use <a href="http://localhost:5173">Port 5173</a> for the Frontend.</p>
</body>
</html>
