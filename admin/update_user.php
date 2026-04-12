<?php
session_start();

if (!isset($_SESSION['user']) || $_SESSION['user']['grupo'] !== 'admin') {
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);

$file = __DIR__ . "/../data/users/users.json";
$data = json_decode(file_get_contents($file), true);

foreach ($data['users'] as &$u) {

    if ($u['id'] == $input['originalId']) {
    
        $u['id'] = (int)$input['id'];
        $u['numero'] = (int)$input['numero'];
    
        $u['nome'] = $input['nome'];
        $u['apelido'] = $input['apelido'];
        $u['username'] = $input['username'];
        $u['ano'] = $input['ano'];
        $u['turma'] = $input['turma'];
        $u['AT'] = $input['ano'] . $input['turma'];
        $u['grupo'] = $input['grupo'];
    
        if (!empty($input['password'])) {
            $u['password'] = password_hash($input['password'], PASSWORD_DEFAULT);
        }
    
        break;
    }
}

foreach ($data['users'] as $user) {
    if ($user['username'] === $input['username'] && $user['id'] != $input['originalId']) {
        echo json_encode(["ok" => false, "message" => "Username já existe"]);
        exit;
    }
}

file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode(["ok" => true]);