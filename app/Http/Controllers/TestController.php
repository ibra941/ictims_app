<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TestController extends Controller
{
    public function testDb()
    {
        try {
            $dbName = DB::connection()->getDatabaseName();
            $tables = DB::select('SHOW TABLES');
            $tableNames = array_map(function($table) {
                return reset($table);
            }, $tables);
            
            return response()->json([
                'success' => true,
                'database' => $dbName,
                'tables' => $tableNames,
                'connection' => config('database.connections.mysql'),
                'default' => config('database.default'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'default' => config('database.default'),
            ], 500);
        }
    }
}
