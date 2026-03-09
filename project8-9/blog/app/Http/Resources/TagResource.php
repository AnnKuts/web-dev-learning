<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TagResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tag_name' => $this->tag_name,
            'tag_slug' => $this->tag_slug,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'posts' => PostResource::collection($this->whenLoaded('posts')),
        ];
    }
}
