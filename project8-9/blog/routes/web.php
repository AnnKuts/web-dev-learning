<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/posts/{id}', function (string $id) {
    return view('posts.show', ['postId' => $id]);
})->whereNumber('id')->name('posts.page');

Route::prefix('auth/google')->middleware('throttle:20,1')->group(function () {
    Route::post('start', [\App\Http\Controllers\GoogleAuthController::class, 'start'])->block(10, 10);
    Route::get('callback', [\App\Http\Controllers\GoogleAuthController::class, 'callback'])->block(10, 10);
    Route::post('exchange', [\App\Http\Controllers\GoogleAuthController::class, 'exchange'])->block(10, 10);
});
