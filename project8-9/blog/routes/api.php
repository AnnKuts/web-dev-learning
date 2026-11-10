<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\TagController;
use App\Http\Controllers\CommentController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::resource('users', UserController::class);
    Route::get('posts/{post}/comments', [CommentController::class, 'index']);
    Route::post('posts/{post}/comments', [CommentController::class, 'store'])->middleware('throttle:10,1');
    Route::put('posts/{post}/comments/{comment}', [CommentController::class, 'update']);
    Route::delete('posts/{post}/comments/{comment}', [CommentController::class, 'destroy']);
    Route::get('posts/recent', [PostController::class, 'recent']);
    Route::resource('posts', PostController::class);
    Route::resource('tags',  TagController::class);
});
