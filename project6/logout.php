<?php

session_start();
session_destroy();
setcookie("last_name", "", time() - 3600, "/");
header("Location: index.php");
exit;
