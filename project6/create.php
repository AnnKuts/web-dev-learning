<?php
require_once "classes/User.php";
require_once "classes/Post.php";

session_start();
if (!isset($_SESSION["user"])) {
    header("Location: login.php");
    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $content = $_POST["content"] ?? "";

    if (trim($content) != "" && strlen(trim($content)) < 3) {
        $error = "Post content must be at least 3 characters (if not empty).";
    }


    $tagsRaw = $_POST["tags"] ?? "";
    $tags = explode(",", $tagsRaw);
    $tags = array_map("trim", $tags);
    $tags = array_filter($tags, fn($t) => $t !== "");

    $_SESSION["posts"][] = new Post(
        $content,
        $_SESSION["user"],
        $tags,
    );

    header("Location: index.php");
    exit;
}
?>

<form method="POST">
    <textarea name="content"></textarea>

    <input type="text" name="tags" placeholder="Tags">

    <button type="submit">Publish</button>
</form>