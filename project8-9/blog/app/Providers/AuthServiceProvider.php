<?php

namespace App\Providers;

use App\Models\Comment;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;
use App\Policies\CommentPolicy;
use App\Policies\PostPolicy;
use App\Policies\TagPolicy;
use App\Policies\UserPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    protected $policies = [
        Post::class => PostPolicy::class,
        Comment::class => CommentPolicy::class,
        Tag::class => TagPolicy::class,
        User::class => UserPolicy::class,
    ];

    public function register(): void
    {
    }

    public function boot(): void
    {
        $this->registerPolicies();

        Gate::before(function (?User $user, string $ability, array $arguments) {
            if ($ability === 'delete' && ($arguments[0] ?? null) instanceof Tag) {
                return null;
            }
            if (app()->isLocal() && filter_var(config('auth.dev_bypass', false), FILTER_VALIDATE_BOOLEAN)) {
                return true;
            }
        });
    }
}
