<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/posts/{id}', function (string $id) {
    return view('posts.show', ['postId' => $id]);
})->whereNumber('id')->name('posts.show');
