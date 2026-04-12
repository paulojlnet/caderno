<?php
$data = json_decode(file_get_contents(__DIR__ . "/../data/users/users.json"), true);

$anos = [];
$turmas = [];

foreach ($data['users'] as $u) {
    if (!empty($u['ano'])) $anos[$u['ano']] = true;
    if (!empty($u['turma'])) $turmas[$u['turma']] = true;
}

echo json_encode([
    "anos" => array_keys($anos),
    "turmas" => array_keys($turmas)
]);