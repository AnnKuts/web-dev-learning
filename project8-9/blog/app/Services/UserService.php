<?php

namespace App\Services;

use App\Models\User;

class UserService
{
    public function updateProfile(User $user, array $data): User
    {
        $attributes = [];

        if (array_key_exists('username', $data)) {
            $attributes['username'] = $data['username'];
        }

        if (array_key_exists('user_bio', $data)) {
            $attributes['user_bio'] = $data['user_bio'];
        }

        if ($attributes !== []) {
            $user->update($attributes);
        }

        return $user->refresh();
    }

    public function updateBio(User $user, ?string $bio): User
    {
        return $this->updateProfile($user, ['user_bio' => $bio]);
    }

    public function delete(User $user): void
    {
        $user->delete();
    }

    public function restore(int $id): User
    {
        $user = User::withTrashed()->findOrFail($id);
        $user->restore();

        return $user;
    }
}
