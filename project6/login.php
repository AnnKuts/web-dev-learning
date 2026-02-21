<?php
session_start();
require_once "classes/User.php";

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $name = $_POST["name"];
    $_SESSION["user"] = new User($name, "1234");
    header("Location: index.php");
    exit;
}
?>

<form method="POST">
    <input type="text" name="name" placeholder="Your name">
    <button type="submit">Login</button>
</form>