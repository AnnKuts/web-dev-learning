<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class ProfilePostListing
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! app()->environment('local', 'testing') || ! $request->is('api/posts')) {
            return $next($request);
        }

        $start = microtime(true);
        $queries = 0;
        DB::listen(function () use (&$queries): void { $queries++; });
        $response = $next($request);
        Log::info('post_listing_profile', [
            'elapsed_ms' => round((microtime(true) - $start) * 1000, 3),
            'peak_memory_bytes' => memory_get_peak_usage(true),
            'sql_queries' => $queries,
            'status' => $response->getStatusCode(),
        ]);

        return $response;
    }
}
