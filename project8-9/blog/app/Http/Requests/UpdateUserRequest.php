<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_bio' => 'required|string|max:1000',
            'username' => 'sometimes|string|max:255|unique:users,username,' . $this->route('user')->id,
            'email' => 'sometimes|email|max:255|unique:users,email,' . $this->route('user')->id,
        ];
    }
}
