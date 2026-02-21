<?php

class User
{
    public string $name;
    private string $password;

    public function __construct(string $name, string $password)
    {
        $this->name = $name;
        $this->password = $password;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function __toString(): string
    {
        return "User: {$this->name}";
    }
}
