<?php

namespace Tests\Feature;

use App\Models\User;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Psr7\Response;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Socialite\Facades\Socialite;
use Tests\TestCase;

class GoogleAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        config(['services.google' => ['client_id' => 'test-client', 'client_secret' => 'test-secret', 'redirect' => 'http://localhost/auth/google/callback'], 'auth.dev_bypass' => false]);
    }

    private function start(array $claims = [], string $mode = 'login', ?string $token = null, string $password = 'password'): string
    {
        Socialite::forgetDrivers();
        Socialite::driver('google')->setHttpClient(new Client(['handler' => HandlerStack::create(new MockHandler([
            new Response(200, [], json_encode(['access_token' => 'mock-access', 'token_type' => 'Bearer', 'expires_in' => 3600])),
            new Response(200, [], json_encode(array_replace(['sub' => 'google-subject', 'email' => 'google@example.test', 'email_verified' => true, 'name' => 'Test User'], $claims))),
        ]))]));
        $response = $this->postJson('/auth/google/start', compact('mode', 'password'), $token ? ['Authorization' => 'Bearer '.$token] : []);
        $response->assertOk();
        parse_str(parse_url($response->json('url'), PHP_URL_QUERY), $query);
        $this->assertNotEmpty($query['state']);
        $this->assertSame('S256', $query['code_challenge_method']);
        $this->assertNotEmpty($query['code_challenge']);

        return $query['state'];
    }

    private function googleCallback(string $state)
    {
        return $this->get('/auth/google/callback?code=mock-code&state='.urlencode($state));
    }

    private function code($response): string
    {
        $response->assertRedirect();
        parse_str(parse_url($response->headers->get('Location'), PHP_URL_FRAGMENT), $params);
        $this->assertArrayHasKey('google_code', $params);
        $this->withCookie(config('session.cookie'), $response->getCookie(config('session.cookie'))->getValue());

        return $params['google_code'];
    }

    public function test_registration_exchange_protected_api_logout_and_replay(): void
    {
        $code = $this->code($this->googleCallback($this->start()));
        $user = User::sole();
        $this->assertNull($user->password);
        $this->assertSame('google-subject', $user->google_id);
        $this->assertNotNull($user->email_verified_at);
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $result = $this->postJson('/auth/google/exchange', ['code' => $code])->assertOk();
        $token = $result->json('token');
        $this->postJson('/auth/google/exchange', ['code' => $code])->assertUnauthorized();
        $this->getJson('/api/posts', ['Authorization' => 'Bearer '.$token])->assertOk();
        $this->postJson('/api/logout', [], ['Authorization' => 'Bearer '.$token])->assertOk();
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->app['auth']->forgetGuards();
        $this->getJson('/api/posts', ['Authorization' => 'Bearer '.$token])->assertUnauthorized();
        $this->app['auth']->shouldUse('web');
        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'anything'])->assertUnauthorized();
    }

    public function test_returning_user_uses_subject_even_when_google_email_changes(): void
    {
        $this->code($this->googleCallback($this->start()));
        $id = User::sole()->id;
        $this->code($this->googleCallback($this->start(['email' => 'changed@example.test'])));
        $this->assertDatabaseCount('users', 1);
        $this->assertSame($id, User::sole()->id);
        $this->assertSame('google@example.test', User::sole()->email);
    }

    public function test_matching_email_does_not_link_or_duplicate_even_if_deleted(): void
    {
        $user = User::factory()->create(['email' => 'GOOGLE@example.test']);
        $this->googleCallback($this->start())->assertRedirect('/#google_status=failed');
        $this->assertNull($user->fresh()->google_id);
        $user->delete();
        $this->googleCallback($this->start())->assertRedirect('/#google_status=failed');
        $this->assertDatabaseCount('users', 1);
    }

    public function test_explicit_link_requires_token_password_and_google_identity(): void
    {
        $user = User::factory()->create(['email' => 'google@example.test']);
        $token = $user->createToken('test')->plainTextToken;
        $this->postJson('/auth/google/start', ['mode' => 'link', 'password' => 'password'])->assertForbidden();
        $this->postJson('/auth/google/start', ['mode' => 'link', 'password' => 'wrong'], ['Authorization' => 'Bearer '.$token])->assertForbidden();
        $this->googleCallback($this->start([], 'link', $token))->assertRedirect('/#google_status=linked');
        $this->assertSame('google-subject', $user->fresh()->google_id);
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('oauth_exchanges', 0);
        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'password'])->assertOk()->assertJsonStructure(['token', 'user']);
        $this->googleCallback($this->start(['sub' => 'different-subject'], 'link', $token))->assertRedirect('/#google_status=failed');
        $this->assertSame('google-subject', $user->fresh()->google_id);
    }

    public function test_link_cannot_take_another_users_google_identity_or_use_revoked_token(): void
    {
        $this->code($this->googleCallback($this->start()));
        $other = User::factory()->create();
        $token = $other->createToken('test')->plainTextToken;
        $this->googleCallback($this->start([], 'link', $token))->assertRedirect('/#google_status=failed');
        $state = $this->start(['sub' => 'unused'], 'link', $token);
        $other->tokens()->delete();
        $this->googleCallback($state)->assertRedirect('/#google_status=failed');
        $this->assertNull($other->fresh()->google_id);
    }

    public function test_invalid_state_cancelled_failed_and_unverified_callbacks(): void
    {
        $this->start();
        $this->googleCallback('wrong-state')->assertRedirect('/#google_status=failed');
        $state = $this->start();
        $this->get('/auth/google/callback?error=access_denied&state='.$state)->assertRedirect('/#google_status=failed');
        $this->googleCallback($this->start(['email_verified' => false]))->assertRedirect('/#google_status=failed');
        $this->googleCallback($this->start(['sub' => '']))->assertRedirect('/#google_status=failed');
        $state = $this->start();
        Socialite::driver('google')->setHttpClient(new Client(['handler' => HandlerStack::create(new MockHandler([new Response(500)]))]));
        $this->googleCallback($state)->assertRedirect('/#google_status=failed');
        $this->assertDatabaseCount('users', 0);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_oauth_posts_require_csrf_and_callback_cannot_be_replayed(): void
    {
        $state = $this->start();
        $this->code($this->googleCallback($state));
        $this->googleCallback($state)->assertRedirect('/#google_status=failed');
        $this->app['env'] = 'production';
        $this->postJson('/auth/google/start', ['mode' => 'login'])->assertStatus(419);
        $this->postJson('/auth/google/exchange', ['code' => str_repeat('a', 64)])->assertStatus(419);
    }

    public function test_exchange_is_expiring_and_bound_to_the_starting_browser(): void
    {
        $code = $this->code($this->googleCallback($this->start()));
        DB::table('oauth_exchanges')->update(['session_hash' => str_repeat('0', 64)]);
        $this->postJson('/auth/google/exchange', ['code' => $code])->assertUnauthorized();
        $code = $this->code($this->googleCallback($this->start()));
        $this->travel(61)->seconds();
        $this->postJson('/auth/google/exchange', ['code' => $code])->assertUnauthorized();
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
