<?php

namespace App\Services;

use App\Models\User;

class UserService
{
    public function updateBio(User $user, string $bio): User
    {
        $user->update([
            'user_bio' => $bio
        ]);

        return $user;
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
