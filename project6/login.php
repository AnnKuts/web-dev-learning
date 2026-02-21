<?php
session_start();
require_once "classes/User.php";

$lastName = $_COOKIE["last_name"] ?? "";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $field = "name";
    $$field = $_POST["name"] ?? "";

    setcookie("last_name", $name, time() + 60 * 60 * 24 * 30, "/");

    $_SESSION["user"] = new User($name, "1234");
    header("Location: index.php");
    exit;
}
?>

<form method="POST">
    <label for="name">Your name</label><br>
    <input
            id="name"
            type="text"
            name="name"
            placeholder="Your name"
            value="<?= htmlspecialchars($lastName) ?>"
    >
    <button type="submit">Login</button>
</form>