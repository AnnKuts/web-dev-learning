<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class DevAuthBypass
{
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->isLocal() && filter_var(config('auth.dev_bypass', false), FILTER_VALIDATE_BOOLEAN)) {
            if ($request->is('api/login', 'api/register')) {
                return $next($request);
            }

            $user = $request->bearerToken() ? Auth::guard('sanctum')->user() : null;

            $user ??= User::where('email', config('auth.dev_user_email', 'dev@example.com'))->first();

            if ($user) {
                Auth::guard('sanctum')->setUser($user);
                Auth::setUser($user);
                $request->setUserResolver(fn () => $user);
            }
        }

        return $next($request);
    }
}
