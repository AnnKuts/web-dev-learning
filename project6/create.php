<?php
require_once "classes/User.php";
require_once "classes/Post.php";

session_start();
if (!isset($_SESSION["user"])) {
    header("Location: login.php");
    exit;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $_SESSION["posts"][] = new Post(
        $_POST["content"],
        $_SESSION["user"]
    );
    header("Location: index.php");
    exit;
}
?>

<form method="POST">
    <textarea name="content"></textarea>
    <button type="submit">Publish</button>
</form>