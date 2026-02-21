<?php

require_once __DIR__ . "/Timestamp.php";
require_once __DIR__ . "/Renderable.php";
require_once __DIR__ . "/User.php";

class Post implements Renderable
{
    use Timestamp;

    private string $content;
    private User $author;
    private array $tags;
    private string $createdAt;

    public function __construct(string $content, User $author, array $tags = [])
    {
        $this->content = $content;
        $this->author = $author;
        $this->tags = $tags;
        $this->createdAt = $this->now();
    }

    public function render(): string
    {
        $safeAuthor = htmlspecialchars($this->author->getName());
        $safeContent = htmlspecialchars($this->content);
        $tagsText = "";
        if (!empty($this->tags)) {
            $safeTags = array_map("htmlspecialchars", $this->tags);
            $tagsText = " <small># " . implode(", ", $safeTags) . "</small>";
        }
        $safeTime = htmlspecialchars($this->createdAt);

        return "<p><b>$safeAuthor</b>: $safeContent
        <small>($safeTime)</small>$tagsText</p>";
    }
}
