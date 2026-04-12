<?php
session_start();

if ($_SESSION['grupo'] !== 'professor') {
    die("Sem permissão");
}

$dados = json_decode(file_get_contents("php://input"), true);

require_once __DIR__ . "/../helpers.php";

$letivo = $_SESSION['letivo'] ?? getAnoLetivo();

$file = __DIR__ . "/../data/cadernos/" . $letivo . "/cadernos.json";

$lista = json_decode(file_get_contents($file), true);

foreach ($lista as &$caderno) {

    if ($caderno['id'] === $dados['id']) {

        $caderno['titulo'] = $dados['titulo'];
        $caderno['disciplina'] = strtoupper($dados['disciplina']);
        $caderno['ano'] = $dados['ano'];
        $caderno['turmas'] = $dados['turmas'];
        $caderno['cor'] = $dados['cor'];

        break;
    }
}

file_put_contents($file, json_encode($lista, JSON_PRETTY_PRINT), LOCK_EX);

echo json_encode(["ok" => true]);