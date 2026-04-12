<?php
session_start();

if (!isset($_SESSION['user']) || $_SESSION['user']['grupo'] !== 'admin') {
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

$file = __DIR__ . "/../data/users/users.json";
$data = json_decode(file_get_contents($file), true);

$users = $data['users'] ?? [];

$input['AT'] = $input['ano'] . $input['turma'];

// 🔥 PASSWORD obrigatória no novo utilizador
if (empty($input['password'])) {
    echo json_encode(["ok" => false, "message" => "Password obrigatória"]);
    exit;
}

$input['password'] = password_hash($input['password'], PASSWORD_DEFAULT);

$users[] = $input;

foreach ($data['users'] as $user) {
    if ($user['username'] === $input['username'] && $user['id'] != $input['originalId']) {
        echo json_encode(["ok" => false, "message" => "Username já existe"]);
        exit;
    }
}

file_put_contents($file, json_encode(["users" => $users], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode([
    "ok" => true,
    "message" => "Utilizador criado com sucesso"
]);