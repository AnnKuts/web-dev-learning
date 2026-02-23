<?php

namespace App\Models;

class Post
{
    public string $content;
    public string $authorName;
    public array $tags;
    public string $time;

    public function __construct(string $content, string $authorName, array $tags = [])
    {
        $this->content = $content;
        $this->authorName = $authorName;
        $this->tags = $tags;
        $this->time = date('H:i:s');
    }
}