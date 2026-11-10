<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AvatarTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('images');
    }

    public function test_upload_replace_delete_and_google_only_account(): void
    {
        $user = User::factory()->create(['password' => null]);
        $this->actingAs($user)->postJson('/api/me/avatar', ['avatar' => UploadedFile::fake()->image('first.png', 700, 700)])->assertOk();
        $first = $user->fresh()->avatar_path;
        Storage::disk('images')->assertExists($first);
        $this->actingAs($user)->postJson('/api/me/avatar', ['avatar' => UploadedFile::fake()->image('second.jpg')])->assertOk();
        Storage::disk('images')->assertMissing($first);
        $second = $user->fresh()->avatar_path;
        $this->actingAs($user)->deleteJson('/api/me/avatar')->assertOk();
        Storage::disk('images')->assertMissing($second);
        $this->assertNull($user->fresh()->avatar_path);
    }

    public function test_validation_and_guest_restriction(): void
    {
        $this->postJson('/api/me/avatar', ['avatar' => UploadedFile::fake()->image('x.png')])->assertUnauthorized();
        $user = User::factory()->create();
        $this->actingAs($user)->postJson('/api/me/avatar', ['avatar' => UploadedFile::fake()->create('evil.php', 10, 'application/x-php')])->assertUnprocessable();
        $this->actingAs($user)->postJson('/api/me/avatar', ['avatar' => UploadedFile::fake()->image('big.jpg')->size(3000)])->assertUnprocessable();
        $this->assertNull($user->fresh()->avatar_path);
    }
}
