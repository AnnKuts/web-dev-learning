<?php

namespace App\Services;

use App\Models\Tag;

class TagService
{
    public function create(array $data): Tag
    {
        return Tag::create($data);
    }

    public function update(Tag $tag, array $data): Tag
    {
        $tag->update($data);
        return $tag;
    }

    public function delete(Tag $tag): void
    {
        $tag->delete();
    }

    public function restore(int $id): Tag
    {
        $tag = Tag::withTrashed()->findOrFail($id);
        $tag->restore();

        return $tag;
    }
}
