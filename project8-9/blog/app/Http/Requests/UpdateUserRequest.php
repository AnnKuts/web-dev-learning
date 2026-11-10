<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        $target = $this->route('user');

        return $target instanceof User
            && $this->user() !== null
            && $this->user()->can('update', $target);
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('username') && is_string($this->input('username'))) {
            $this->merge([
                'username' => trim($this->input('username')),
            ]);
        }
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'username' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:255',
                Rule::unique('users', 'username')->ignore($userId),
            ],
            'user_bio' => [
                'sometimes',
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }
}
