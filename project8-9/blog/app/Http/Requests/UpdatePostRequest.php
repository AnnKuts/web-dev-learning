<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'header' => 'sometimes|string|min:5|max:100',
            'description' => 'sometimes|string|min:20',
            'tags' => 'array',
            'tags.*' => 'exists:tags,id',
            'images' => ['sometimes', 'array', 'max:5'],
            'images.*' => ['required', 'file', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
            'clear_tags' => ['sometimes', 'boolean'],
            'remove_images' => ['sometimes', 'array'],
            'remove_images.*' => ['integer', 'distinct', 'exists:post_images,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'header.min' => 'Заголовок статті має містити щонайменше 5 символів.',
            'header.max' => 'Заголовок статті не повинен перевищувати 100 символів.',
            'description.min' => 'Контент статті має містити щонайменше 20 символів.',
            'tags.array' => 'Теги мають бути масивом.',
            'tags.*.exists' => 'Обраний тег не існує.',
            'images.array' => 'Зображення мають передаватися у вигляді списку файлів.',
            'images.max' => 'До статті можна додати щонайбільше 5 зображень.',
            'images.*.required' => 'Файл зображення не передано.',
            'images.*.file' => 'Не вдалося завантажити файл зображення.',
            'images.*.uploaded' => 'Не вдалося завантажити зображення (перевірте, чи розмір файлу не перевищує 5 МБ).',
            'images.*.image' => 'Обраний файл має бути коректним зображенням.',
            'images.*.mimes' => 'Підтримуються лише зображення у форматах JPEG, PNG або WebP.',
            'images.*.max' => 'Розмір кожного зображення не повинен перевищувати 5 МБ.',
        ];
    }
}
