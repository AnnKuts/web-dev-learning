<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'header' => 'required|string|min:5|max:100',
            'description' => 'required|string|min:20',
            'tags' => 'array',
            'tags.*' => 'exists:tags,id',
            'images' => ['sometimes', 'array', 'max:5'],
            'images.*' => ['required', 'file', 'image', 'mimes:jpeg,png,webp', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'header.required' => 'Заголовок статті обов\'язковий.',
            'header.min' => 'Заголовок статті має містити щонайменше 5 символів.',
            'header.max' => 'Заголовок статті не повинен перевищувати 100 символів.',
            'description.required' => 'Контент статті обов\'язковий.',
            'description.min' => 'Контент статті має містити щонайменше 20 символів.',
            'tags.array' => 'Теги мають бути масивом.',
            'tags.*.exists' => 'Обраний тег не існує.',
        ];
    }
}
