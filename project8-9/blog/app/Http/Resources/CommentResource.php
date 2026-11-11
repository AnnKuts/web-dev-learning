<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CommentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'content' => $this->content,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'author' => $this->user && ! $this->user->trashed() ? [
                'id' => $this->user->id,
                'username' => $this->user->username,
                'avatar_url' => $this->user->avatar_url,
            ] : ['id' => null, 'username' => 'Видалений користувач', 'avatar_url' => null],
            'can_edit' => $request->user()?->id === $this->user_id,
        ];
    }
}
