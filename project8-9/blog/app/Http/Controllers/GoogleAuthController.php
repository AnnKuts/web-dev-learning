<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class GoogleAuthController extends Controller
{
    public function __construct(private readonly ImageService $images) {}

    public function start(Request $request)
    {
        abort_unless(config('services.google.client_id') && config('services.google.client_secret') && config('services.google.redirect'), 503, 'Google sign-in is not configured.');
        $input = $request->validate(['mode' => 'required|in:login,link', 'password' => 'nullable|string']);
        $token = null;
        if ($input['mode'] === 'link') {
            $token = $this->validToken($request->bearerToken());
            abort_unless($token && $token->tokenable?->password && Hash::check($input['password'] ?? '', $token->tokenable->password), 403, 'Sign in and confirm your current password to link Google.');
        }
        $request->session()->regenerate();
        $request->session()->put('google_flow', [
            'expires' => time() + 300,
            'mode' => $input['mode'],
            'token_id' => $token?->id,
        ]);
        $redirect = Socialite::driver('google')->setRequest($request)->enablePKCE()->scopes(['openid', 'email', 'profile'])->with(['prompt' => 'select_account'])->redirect();

        return response()->json(['url' => $redirect->getTargetUrl()])->header('Cache-Control', 'no-store');
    }

    public function callback(Request $request)
    {
        $flow = $request->session()->pull('google_flow');
        try {
            $state = $request->session()->get('state');
            if (! $flow || $flow['expires'] < time() || ! is_string($state) || ! is_string($request->query('state')) || ! hash_equals($state, $request->query('state'))) {
                throw new \RuntimeException('Invalid state');
            }
            if ($request->has('error')) {
                throw new \RuntimeException('Cancelled');
            }
            // Stateful Socialite validates and consumes state, then calls Google's userinfo endpoint.
            $identity = Socialite::driver('google')->setRequest($request)->enablePKCE()->user();
            $subject = $identity->user['sub'] ?? null;
            $email = $identity->getEmail();
            if (! is_string($subject) || $subject === '' || strlen($subject) > 255 || $subject !== $identity->getId()
                || ($identity->user['email_verified'] ?? false) !== true || ! is_string($email) || strlen($email) > 255 || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new \RuntimeException('Invalid identity');
            }
            $displayName = self::resolveDisplayName($identity);
            $user = DB::transaction(function () use ($flow, $subject, $email, $displayName) {
                $existing = User::withTrashed()->where('google_id', $subject)->first();
                if ($flow['mode'] === 'link') {
                    $token = PersonalAccessToken::find($flow['token_id']);
                    abort_unless($token && $this->tokenIsCurrent($token), 403);
                    $user = User::lockForUpdate()->findOrFail($token->tokenable_id);
                    if (($existing && $existing->id !== $user->id) || ($user->google_id && $user->google_id !== $subject)) {
                        throw new \RuntimeException('Identity already linked');
                    }
                    $user->forceFill(['google_id' => $subject])->save();

                    return $user;
                }
                if ($existing) {
                    abort_if($existing->trashed(), 403);
                    $repairedUsername = self::stripLegacyGeneratedSuffix($existing->username, $displayName);
                    if ($repairedUsername !== null && $repairedUsername !== $existing->username) {
                        $existing->forceFill(['username' => $repairedUsername])->save();
                    }

                    return $existing;
                }
                // Include soft-deleted users and case variants; email ownership never implies account ownership.
                if (User::withTrashed()->whereRaw('LOWER(email) = ?', [strtolower($email)])->exists()) {
                    throw new \RuntimeException('Sign in with password and explicitly link Google');
                }
                $user = new User([
                    'username' => $displayName,
                    'email' => strtolower($email),
                    'password' => null,
                ]);
                $user->forceFill(['google_id' => $subject, 'email_verified_at' => now()])->save();

                return $user;
            });
            $this->syncGoogleAvatarIfMissing($user, $identity);
            if ($flow['mode'] === 'link') {
                return $this->finish('google_status=linked');
            }
            $request->session()->regenerate();
            $code = Str::random(64);
            DB::table('oauth_exchanges')->where('expires_at', '<', now())->delete();
            DB::table('oauth_exchanges')->insert([
                'code_hash' => hash('sha256', $code),
                'session_hash' => hash('sha256', $request->session()->getId()),
                'user_id' => $user->id,
                'expires_at' => now()->addMinute(),
            ]);

            return $this->finish('google_code='.$code);
        } catch (Throwable $exception) {
            // Do not log provider responses, credentials, codes, or token-bearing URLs.
            Log::notice('Google sign-in failed', ['exception_type' => get_class($exception)]);

            return $this->finish('google_status=failed');
        } finally {
            $request->session()->forget(['state', 'code_verifier']);
        }
    }

    public function exchange(Request $request)
    {
        $input = $request->validate(['code' => 'required|string|size:64']);

        return DB::transaction(function () use ($request, $input) {
            $hash = hash('sha256', $input['code']);
            $exchange = DB::table('oauth_exchanges')->where('code_hash', $hash)->lockForUpdate()->first();
            abort_unless($exchange && $exchange->expires_at > now()->toDateTimeString()
                && hash_equals($exchange->session_hash, hash('sha256', $request->session()->getId())), 401);
            $user = User::findOrFail($exchange->user_id);
            abort_unless(DB::table('oauth_exchanges')->where('code_hash', $hash)->delete() === 1, 401);

            return response()->json([
                'user' => new UserResource($user),
                'token' => $user->createToken('google-browser')->plainTextToken,
            ])->header('Cache-Control', 'no-store');
        });
    }

    public static function resolveDisplayName(object $identity): string
    {
        $rawName = method_exists($identity, 'getName') ? $identity->getName() : null;
        if (! is_string($rawName) || trim($rawName) === '') {
            $rawName = $identity->user['name'] ?? $identity->user['given_name'] ?? null;
        }
        $cleaned = is_string($rawName)
            ? trim(preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $rawName) ?? '')
            : '';
        $cleaned = preg_replace('/\s+/u', ' ', $cleaned) ?? '';

        if (mb_strlen($cleaned) < 2) {
            return 'Google user';
        }

        return Str::limit($cleaned, 200, '');
    }

    public static function stripLegacyGeneratedSuffix(string $currentUsername, ?string $googleDisplayName = null): ?string
    {
        $candidates = array_values(array_filter(array_unique([
            $googleDisplayName ? Str::limit(trim($googleDisplayName), 200, '') : null,
            'Google user',
        ])));

        foreach ($candidates as $baseName) {
            $pattern = '/^'.preg_quote($baseName, '/').' ([A-Za-z0-9]{12})$/u';
            if (preg_match($pattern, $currentUsername)) {
                return $baseName;
            }
        }

        return null;
    }

    private function syncGoogleAvatarIfMissing(User $user, object $identity): void
    {
        if (! empty($user->avatar_path)) {
            return;
        }
        $avatarUrl = method_exists($identity, 'getAvatar') ? $identity->getAvatar() : null;
        if (! is_string($avatarUrl) || trim($avatarUrl) === '') {
            $avatarUrl = $identity->user['picture'] ?? null;
        }
        if (! is_string($avatarUrl) || trim($avatarUrl) === '') {
            return;
        }
        try {
            $path = $this->images->storeGoogleAvatar(trim($avatarUrl), 512);
            $user->forceFill(['avatar_path' => $path])->save();
        } catch (Throwable $e) {
            Log::warning('Google avatar sync skipped', ['user_id' => $user->id]);
        }
    }

    private function validToken(?string $bearer): ?PersonalAccessToken
    {
        $token = $bearer ? PersonalAccessToken::findToken($bearer) : null;

        return $token && $this->tokenIsCurrent($token) ? $token : null;
    }

    private function tokenIsCurrent(PersonalAccessToken $token): bool
    {
        return $token->tokenable instanceof User && ! $token->tokenable->trashed()
            && (! $token->expires_at || $token->expires_at->isFuture())
            && (! config('sanctum.expiration') || $token->created_at->gt(now()->subMinutes(config('sanctum.expiration'))));
    }

    private function finish(string $fragment)
    {
        return redirect('/#'.$fragment)->header('Cache-Control', 'no-store')->header('Referrer-Policy', 'no-referrer');
    }
}
