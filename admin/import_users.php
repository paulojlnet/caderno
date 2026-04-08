<?php
session_start();

// 🔐 segurança
if (!isset($_SESSION['user']) || $_SESSION['user']['grupo'] !== 'admin') {
    echo json_encode(["message" => "Acesso negado"]);
    exit;
}

function limpar($v) {
    return trim(mb_convert_encoding($v, "UTF-8", "UTF-8, ISO-8859-1, Windows-1252"));
}

$input = json_decode(file_get_contents("php://input"), true);

if (!is_array($input)) {
    echo json_encode(["message" => "Dados inválidos"]);
    exit;
}

$filePath = __DIR__ . "/../data/users/users.json";

// 🔥 carregar existentes
$existing = [];

if (file_exists($filePath)) {
    $json = json_decode(file_get_contents($filePath), true);
    $existing = $json['users'] ?? [];
}

// 🔥 usernames existentes
$map = [];

foreach ($existing as $index => $user) {
    $map[$user['username']] = $index;
}

foreach ($input as $u) {

    // 🔥 limpar username
    $username = limpar($u['username']);

    // 🔥 construir utilizador
    $ano = limpar($u['ano']);
    $turma = limpar($u['turma']);
    
    $newUser = [
        "id" => (int)$u['id'],
        "username" => $username,
        "password" => !empty($u['senha'])
            ? password_hash($u['senha'], PASSWORD_DEFAULT)
            : null,
        "nome" => limpar($u['nome']),
        "apelido" => limpar($u['apelido']),
        "ano" => $ano,
        "turma" => $turma,
        "AT" => trim($ano . $turma),
        "numero" => (int)$u['numero'],
        "grupo" => limpar($u['grupo'])
    ];

    // 🔥 se já existe → atualizar
    if (isset($map[$username])) {

        $idx = $map[$username];

        // ✔ manter password se não vier no CSV
        if (empty($u['senha'])) {
            $newUser['password'] = $existing[$idx]['password'];
        }

        $existing[$idx] = $newUser;

    } else {

        // ✔ novo utilizador → garantir password
        if ($newUser['password'] === null) {
            continue; // ignora se não tem password
        }

        $existing[] = $newUser;
    }
}

// 🔥 guardar
file_put_contents(
    $filePath,
    json_encode(["users" => $existing], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
    LOCK_EX
);

echo json_encode(["message" => "Utilizadores importados com sucesso"]);