<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;

class AuthController extends Controller
{
    public function show(Request $request)
    {
        $lastName = (string) $request->cookie('last_name', '');

        return view('login', [
            'lastName' => $lastName,
        ]);
    }

    public function login(Request $request)
    {
        $name = (string) $request->input('name', '');
        $cookie = Cookie::make('last_name', $name, 60 * 24 * 30, '/');
        $request->session()->put('user', [
            'name' => $name,
        ]);

        return redirect()->route('home')->withCookie($cookie);
    }

    public function logout(Request $request)
    {
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()
            ->route('home')
            ->withCookie(Cookie::forget('last_name', '/'));
    }
}
