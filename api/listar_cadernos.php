<?php
session_start();

$letivo = $_SESSION['letivo'];

$file = __DIR__ . "/../data/cadernos/$letivo/cadernos.json";

if (!file_exists($file)) {
    echo json_encode([]);
    exit;
}

$cadernos = json_decode(file_get_contents($file), true);

$resultado = [];

foreach ($cadernos as $c) {

    // 👨‍🏫 professor → só os seus
    if ($_SESSION['grupo'] === 'professor' && $c['user_id'] == $_SESSION['userID']) {
        $resultado[] = $c;
    }

    // 👨‍🎓 aluno → filtrar por ano + turma
    if ($_SESSION['grupo'] === 'aluno') {
        if (
            $c['ano'] == $_SESSION['ano'] &&
            in_array($_SESSION['turma'], $c['turmas'])
        ) {
            $resultado[] = $c;
        }
    }
}

echo json_encode($resultado);