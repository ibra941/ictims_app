<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DiagnosticController extends Controller
{
    public function test()
    {
        $results = [];
        
        // 1. Check PHP version
        $results['php_version'] = phpversion();
        
        // 2. Check output buffering
        $results['output_buffering'] = ini_get('output_buffering');
        
        // 3. Check if headers are already sent
        if (headers_sent($file, $line)) {
            $results['headers_sent'] = "YES - in $file at line $line";
        } else {
            $results['headers_sent'] = "NO";
        }
        
        // 4. Check session path
        $results['session_save_path'] = session_save_path() ?: ini_get('session.save_path');
        
        // 5. Check storage permissions
        $results['storage_writable'] = is_writable(storage_path()) ? 'YES' : 'NO';
        $results['sessions_writable'] = is_writable(storage_path('framework/sessions')) ? 'YES' : 'NO';
        
        // 6. Check environment
        $results['environment'] = app()->environment();
        
        // 7. Check config
        $results['debug_mode'] = config('app.debug') ? 'ON' : 'OFF';
        
        // 8. Try to set a header
        try {
            header('X-Diagnostic: test');
            $results['header_set'] = 'SUCCESS';
        } catch (\Exception $e) {
            $results['header_set'] = 'FAILED: ' . $e->getMessage();
        }
        
        return response()->json($results);
    }
}
