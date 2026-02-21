<?php

require_once __DIR__ . "/Timestamp.php";
require_once __DIR__ . "/Renderable.php";
require_once __DIR__ . "/User.php";

class Post implements Renderable {
    use Timestamp;

    private string $content;
    private User $author;

    public function __construct(string $content, User $author) {
        $this->content = $content;
        $this->author = $author;
    }

    public function render(): string {
        return "<p><b>{$this->author->getName()}</b>: {$this->content}
        <small>({$this->now()})</small></p>";
    }
}