<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTagRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tag_name' => 'sometimes|string|max:255',
            'tag_slug' => 'sometimes|string|max:255|unique:tags,tag_slug,' . $this->route('tag')->id,
        ];
    }
}
