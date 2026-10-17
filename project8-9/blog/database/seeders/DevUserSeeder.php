<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DevUserSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => config('auth.dev_user_email', 'dev@example.com')],
            [
                'username' => 'devuser',
                'password' => Hash::make('password'),
                'user_bio' => 'Dedicated developer user for local bypass.',
            ]
        );
    }
}
