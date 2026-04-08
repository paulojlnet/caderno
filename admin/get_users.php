<?php
session_start();

if (!isset($_SESSION['user']) || $_SESSION['user']['grupo'] !== 'admin') {
    echo json_encode([]);
    exit;
}

$file = __DIR__ . "/../data/users/users.json";

if (!file_exists($file)) {
    echo json_encode([]);
    exit;
}

$data = json_decode(file_get_contents($file), true);
$users = $data['users'] ?? [];

echo json_encode($users);