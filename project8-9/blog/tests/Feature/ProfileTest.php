<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['auth.dev_bypass' => false]);
    }

    public function test_user_can_update_own_username_and_biography(): void
    {
        $user = User::factory()->create([
            'username' => 'OriginalName',
            'user_bio' => 'Initial biography',
        ]);

        Sanctum::actingAs($user);

        $this->putJson("/api/users/{$user->id}", [
            'username' => 'UpdatedName',
            'user_bio' => 'Updated biography text',
        ])
            ->assertOk()
            ->assertJsonPath('data.username', 'UpdatedName')
            ->assertJsonPath('data.user_bio', 'Updated biography text')
            ->assertJsonPath('data.google_connected', false);

        $this->assertSame('UpdatedName', $user->fresh()->username);
        $this->assertSame('Updated biography text', $user->fresh()->user_bio);

        $this->putJson("/api/users/{$user->id}", [
            'user_bio' => 'Bio only change',
        ])
            ->assertOk()
            ->assertJsonPath('data.username', 'UpdatedName')
            ->assertJsonPath('data.user_bio', 'Bio only change');

        $this->putJson("/api/users/{$user->id}", [
            'username' => 'SecondName',
        ])
            ->assertOk()
            ->assertJsonPath('data.username', 'SecondName')
            ->assertJsonPath('data.user_bio', 'Bio only change');

        $this->putJson("/api/users/{$user->id}", [
            'username' => 'SecondName',
            'user_bio' => '',
        ])
            ->assertOk()
            ->assertJsonPath('data.username', 'SecondName')
            ->assertJsonPath('data.user_bio', null);

        $this->assertNull($user->fresh()->user_bio);
    }

    public function test_unauthorized_users_cannot_update_someone_elses_profile(): void
    {
        $owner = User::factory()->create([
            'username' => 'OwnerUser',
            'user_bio' => 'Owner bio',
        ]);
        $intruder = User::factory()->create([
            'username' => 'IntruderUser',
        ]);

        $this->putJson("/api/users/{$owner->id}", [
            'username' => 'HackedName',
        ])->assertUnauthorized();

        Sanctum::actingAs($intruder);
        $this->putJson("/api/users/{$owner->id}", [
            'username' => 'HackedName',
            'user_bio' => 'Hacked bio',
        ])->assertForbidden();

        $this->assertSame('OwnerUser', $owner->fresh()->username);
        $this->assertSame('Owner bio', $owner->fresh()->user_bio);
    }

    public function test_invalid_usernames_are_rejected(): void
    {
        $existing = User::factory()->create(['username' => 'Ann Kuts']);
        $user = User::factory()->create(['username' => 'MyUsername']);

        Sanctum::actingAs($user);

        $this->putJson("/api/users/{$user->id}", [
            'username' => '',
        ])->assertUnprocessable()->assertJsonValidationErrors(['username']);

        $this->putJson("/api/users/{$user->id}", [
            'username' => '   ',
        ])->assertUnprocessable()->assertJsonValidationErrors(['username']);

        $this->putJson("/api/users/{$user->id}", [
            'username' => 'A',
        ])->assertUnprocessable()->assertJsonValidationErrors(['username']);

        $this->putJson("/api/users/{$user->id}", [
            'username' => str_repeat('a', 256),
        ])->assertUnprocessable()->assertJsonValidationErrors(['username']);

        $this->assertSame('MyUsername', $user->fresh()->username);

        $this->putJson("/api/users/{$user->id}", [
            'username' => $existing->username,
        ])->assertOk()->assertJsonPath('data.username', 'Ann Kuts');
    }

    public function test_email_and_google_id_cannot_be_modified_through_profile_endpoint(): void
    {
        $user = User::factory()->create([
            'username' => 'SafeUser',
            'email' => 'original@example.com',
        ]);
        $user->forceFill(['google_id' => 'original-google-sub'])->save();

        Sanctum::actingAs($user);

        $this->putJson("/api/users/{$user->id}", [
            'username' => 'RenamedSafeUser',
            'email' => 'attacker@example.com',
            'google_id' => 'attacker-google-sub',
        ])
            ->assertOk()
            ->assertJsonPath('data.username', 'RenamedSafeUser')
            ->assertJsonPath('data.email', 'original@example.com')
            ->assertJsonPath('data.google_connected', true)
            ->assertJsonMissingPath('data.google_id');

        $fresh = $user->fresh();
        $this->assertSame('original@example.com', $fresh->email);
        $this->assertSame('original-google-sub', $fresh->google_id);
    }

    public function test_google_only_user_can_update_profile_and_google_connection_is_represented_accurately(): void
    {
        $googleUser = User::factory()->create([
            'username' => 'GoogleUser123',
            'email' => 'googleuser@example.com',
            'password' => null,
            'user_bio' => null,
        ]);
        $googleUser->forceFill(['google_id' => 'google-oauth-sub-999'])->save();

        Sanctum::actingAs($googleUser);

        $this->putJson("/api/users/{$googleUser->id}", [
            'username' => 'AnnaGoogle',
            'user_bio' => 'Updated bio for Google-only account',
        ])
            ->assertOk()
            ->assertJsonPath('data.username', 'AnnaGoogle')
            ->assertJsonPath('data.user_bio', 'Updated bio for Google-only account')
            ->assertJsonPath('data.google_connected', true)
            ->assertJsonPath('data.google_linked', true)
            ->assertJsonMissingPath('data.google_id');

        $this->assertSame('AnnaGoogle', $googleUser->fresh()->username);
        $this->assertSame('Updated bio for Google-only account', $googleUser->fresh()->user_bio);
    }
}
