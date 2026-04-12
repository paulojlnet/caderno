<?php
session_start();

if (!isset($_SESSION['user']) || $_SESSION['user']['grupo'] !== 'admin') {
    exit;
}

$id = $_POST['id'] ?? null;

$file = __DIR__ . "/../data/users/users.json";
$data = json_decode(file_get_contents($file), true);

$users = $data['users'] ?? [];

$users = array_filter($users, fn($u) => $u['id'] != $id);

file_put_contents($file, json_encode(["users" => array_values($users)], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode(["ok" => true]);