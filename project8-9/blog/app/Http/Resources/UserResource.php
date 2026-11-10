<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'username' => $this->username,
            'avatar_url' => $this->avatar_url,
            'email' => $this->email,
            'user_bio' => $this->user_bio,
            'google_linked' => $this->when(
                $request->user()?->is($this->resource) || $request->is('api/login', 'api/register', 'auth/google/*', 'api/me/*'),
                fn () => (bool) $this->google_id
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'posts_count' => $this->whenLoaded('posts', function () {
                return $this->posts->count();
            }),
            'posts' => $this->when($request->routeIs('users.show'), function () {
                return $this->posts->map(function ($post) {
                    return [
                        'id' => $post->id,
                        'header' => $post->header,
                        'description' => $post->description,
                        'created_at' => $post->created_at,
                        'updated_at' => $post->updated_at,
                    ];
                });
            }),
        ];
    }
}
