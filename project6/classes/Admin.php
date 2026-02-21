<?php

require_once __DIR__ . "/User.php";

class Admin extends User {
    private string $role;

    public function __construct(string $name, string $password, string $role) {
        parent::__construct($name, $password);
        $this->role = $role;
    }

    public function getRole(): string {
        return $this->role;
    }
}