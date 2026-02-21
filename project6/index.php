<?php
require_once "classes/User.php";
require_once "classes/Post.php";
require_once "classes/Logger.php";
require_once "classes/Request.php";

session_start();
$user = $_SESSION["user"] ?? null;
$posts = $_SESSION["posts"] ?? [];

$logger = Logger::getInstance();

$limit = (int) (Request::request("limit", 10));
if ($limit <= 0) {
    $limit = 10;
}
if ($limit > 20) {
    $limit = 20;
}

if (isset($_GET["limit"])) {
    $logger->log("Limit from GET: " . (int) $_GET["limit"]);
}

$postsToShow = array_slice($posts, -$limit);
?>

<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Mini Blog</title>
</head>
<body>
<h1>Mini Blog</h1>

<p>
    Theme:
    <a href="index.php?theme=light">light</a> |
    <a href="index.php?theme=dark">dark</a>
</p>

<?php if (!$user): ?>
    <a href="login.php">Login</a>
<?php else: ?>
    <p>Welcome, <?= htmlspecialchars($user->getName()) ?></p>
    <a href="create.php">Create Post</a> |
    <a href="logout.php">Logout</a>

    <p>
        Show:
        <a href="index.php?limit=5">5</a> |
        <a href="index.php?limit=10">10</a> |
        <a href="index.php?limit=20">20</a>
    </p>

    <h3>Posts:</h3>
    <?php foreach ($postsToShow as $post): ?>
        <?= $post->render(); ?>
    <?php endforeach; ?>

    <?php $logger->log("User visited index"); ?>
<?php endif; ?>

</body>
</html>