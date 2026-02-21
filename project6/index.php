<?php
require_once "classes/User.php";
require_once "classes/Post.php";
require_once "classes/Logger.php";

session_start();
$user = $_SESSION["user"] ?? null;
$posts = $_SESSION["posts"] ?? [];

$logger = Logger::getInstance();
?>

    <h1>Mini Blog</h1>

<?php if (!$user): ?>
    <a href="login.php">Login</a>
<?php else: ?>
    <p>Welcome, <?= htmlspecialchars($user->getName()) ?></p>
    <a href="create.php">Create Post</a> |
    <a href="logout.php">Logout</a>

    <h3>Posts:</h3>
    <?php foreach ($posts as $post): ?>
        <?= $post->render(); ?>
    <?php endforeach; ?>

    <?php $logger->log("User visited index"); ?>
<?php endif; ?>