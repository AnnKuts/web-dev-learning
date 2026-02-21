<?php

class Request
{
    public static function method(): string
    {
        return $_SERVER["REQUEST_METHOD"] ?? "GET";
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        return $_GET[$key] ?? $default;
    }

    public static function post(string $key, mixed $default = null): mixed
    {
        return $_POST[$key] ?? $default;
    }

    public static function request(string $key, mixed $default = null): mixed
    {
        return $_REQUEST[$key] ?? $default;
    }

    public static function cookie(string $key, mixed $default = null): mixed
    {
        return $_COOKIE[$key] ?? $default;
    }
}
