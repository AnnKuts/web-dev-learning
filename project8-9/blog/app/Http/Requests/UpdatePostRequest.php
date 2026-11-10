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
        ];
    }
}
