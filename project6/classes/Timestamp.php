<?php

trait Timestamp {
    public function now(): string {
        return date("H:i:s");
    }
}