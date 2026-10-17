<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use Database\Seeders\DevUserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthModeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DevUserSeeder::class);
    }

    public function test_dev_bypass_allows_access_without_bearer_token_using_seeded_dev_user(): void
    {
        app()['env'] = 'local';
        config(['app.env' => 'local']);
        config(['auth.dev_bypass' => true]);

        $response = $this->getJson('/api/posts');
        $response->assertStatus(200);

        $postResponse = $this->postJson('/api/posts', [
            'header'      => 'Dev Bypass Test Header',
            'description' => 'Dev Bypass Test Description',
        ]);
        $postResponse->assertStatus(201);
        $this->assertEquals(config('auth.dev_user_email', 'dev@example.com'), $postResponse->json('data.user.email'));

        $postId = $postResponse->json('data.id');

        $updateResponse = $this->putJson("/api/posts/{$postId}", [
            'header'      => 'Updated Header',
            'description' => 'Updated Description Text',
        ]);
        $updateResponse->assertStatus(200);

        $deleteResponse = $this->deleteJson("/api/posts/{$postId}");
        $deleteResponse->assertStatus(204);

        $tagsResponse = $this->getJson('/api/tags');
        $tagsResponse->assertStatus(200);

        $usersResponse = $this->getJson('/api/users');
        $usersResponse->assertStatus(200);

        $uniqueEmail = 'bypass_' . uniqid() . '@example.com';
        $createUserResponse = $this->postJson('/api/users', [
            'username'              => 'newdevuser' . rand(100, 999),
            'email'                 => $uniqueEmail,
            'password'              => 'secret123',
            'password_confirmation' => 'secret123',
        ]);
        $createUserResponse->assertStatus(201);

        $logoutResponse = $this->postJson('/api/logout');
        $logoutResponse->assertStatus(200);
    }

    public function test_dev_bypass_preserves_bearer_token_if_provided(): void
    {
        app()['env'] = 'local';
        config(['app.env' => 'local']);
        config(['auth.dev_bypass' => true]);

        $customUser = User::factory()->create([
            'email' => 'custom_token_user@example.com',
        ]);
        $token = $customUser->createToken('custom-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/posts', [
                'header'      => 'Custom User Header',
                'description' => 'Custom User Description',
            ]);

        $response->assertStatus(201);
        $this->assertEquals('custom_token_user@example.com', $response->json('data.user.email'));
    }

    public function test_dev_bypass_does_not_create_users_in_middleware(): void
    {
        app()['env'] = 'local';
        config(['app.env' => 'local']);
        config(['auth.dev_bypass' => true]);

        User::where('email', config('auth.dev_user_email', 'dev@example.com'))->forceDelete();
        $userCountBefore = User::count();

        $response = $this->getJson('/api/posts');
        $response->assertStatus(401);

        $this->assertEquals($userCountBefore, User::count());
    }

    public function test_dev_bypass_allows_updating_another_users_post(): void
    {
        app()['env'] = 'local';
        config(['app.env' => 'local']);
        config(['auth.dev_bypass' => true]);

        $otherUser = User::factory()->create();
        $otherPost = Post::create([
            'user_id'     => $otherUser->id,
            'header'      => 'Other User Post Header',
            'description' => 'Other User Post Description',
        ]);

        $response = $this->putJson("/api/posts/{$otherPost->id}", [
            'header'      => 'Updated Header by Dev',
            'description' => 'Updated Description by Dev',
        ]);

        $response->assertStatus(200);
    }

    public function test_auth_is_strictly_enforced_when_dev_bypass_is_disabled(): void
    {
        app()['env'] = 'local';
        config(['app.env' => 'local']);
        config(['auth.dev_bypass' => false]);

        $this->getJson('/api/posts')->assertStatus(401);
        $this->postJson('/api/posts', ['header' => 'Test', 'description' => 'Test'])->assertStatus(401);
        $this->getJson('/api/users')->assertStatus(401);
        $this->getJson('/api/tags')->assertStatus(401);
        $this->postJson('/api/logout')->assertStatus(401);

        $user = User::where('email', config('auth.dev_user_email', 'dev@example.com'))->first();
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/posts');
        $response->assertStatus(200);

        $otherUser = User::factory()->create();
        $otherPost = Post::create([
            'user_id'     => $otherUser->id,
            'header'      => 'Strict Check Header',
            'description' => 'Strict Check Description',
        ]);

        $forbiddenResponse = $this->withHeader('Authorization', "Bearer {$token}")
            ->putJson("/api/posts/{$otherPost->id}", [
                'header'      => 'Illegal Edit',
                'description' => 'Illegal Edit Description',
            ]);
        $forbiddenResponse->assertStatus(403);
    }

    public function test_auth_is_mandatory_in_production_even_if_dev_bypass_is_true(): void
    {
        app()['env'] = 'production';
        config(['app.env' => 'production']);
        config(['auth.dev_bypass' => true]);

        $this->getJson('/api/posts')->assertStatus(401);
        $this->getJson('/api/users')->assertStatus(401);
        $this->getJson('/api/tags')->assertStatus(401);
        $this->postJson('/api/logout')->assertStatus(401);
    }

    public function test_middleware_executes_before_auth_sanctum(): void
    {
        $middlewarePriority = app('router')->middlewarePriority;
        $devBypassIndex = array_search(\App\Http\Middleware\DevAuthBypass::class, $middlewarePriority);
        $authSanctumIndex = array_search(\Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests::class, $middlewarePriority);

        if ($authSanctumIndex === false) {
            $authSanctumIndex = array_search(\Illuminate\Auth\Middleware\Authenticate::class, $middlewarePriority);
        }

        $this->assertNotFalse($devBypassIndex, 'DevAuthBypass must be in middleware priority list.');
        $this->assertNotFalse($authSanctumIndex, 'Authenticate must be in middleware priority list.');
        $this->assertLessThan($authSanctumIndex, $devBypassIndex, 'DevAuthBypass must have higher priority than Authenticate.');
    }

    public function test_post_validation_rules_for_variant_3(): void
    {
        app()['env'] = 'local';
        config(['app.env' => 'local']);
        config(['auth.dev_bypass' => true]);

        $resShortHeader = $this->postJson('/api/posts', [
            'header' => '1234',
            'description' => 'Valid description with more than twenty characters',
        ]);
        $resShortHeader->assertStatus(422)->assertJsonValidationErrors(['header']);

        $resLongHeader = $this->postJson('/api/posts', [
            'header' => str_repeat('a', 101),
            'description' => 'Valid description with more than twenty characters',
        ]);
        $resLongHeader->assertStatus(422)->assertJsonValidationErrors(['header']);

        $resShortDesc = $this->postJson('/api/posts', [
            'header' => 'Valid Header',
            'description' => 'Short text (<20)',
        ]);
        $resShortDesc->assertStatus(422)->assertJsonValidationErrors(['description']);

        $resValid = $this->postJson('/api/posts', [
            'header' => 'Valid Header 5 to 100',
            'description' => 'Valid description with more than twenty characters',
        ]);
        $resValid->assertStatus(201);
    }
}
