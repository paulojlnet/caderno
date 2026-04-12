<?php
session_start();

if ($_SESSION['grupo'] !== 'professor') {
    die("Sem permissão");
}

$dados = json_decode(file_get_contents("php://input"), true);

require_once __DIR__ . "/../helpers.php";

$letivo = $_SESSION['letivo'] ?? getAnoLetivo();

$id = uniqid("c");

$baseDir = __DIR__ . "/../data/cadernos/" . $letivo . "/";
$path = $baseDir . "professores/" . $_SESSION['userID'] . "/" . $id . "/";

if (!is_dir($path)) {
    mkdir($path, 0777, true);
}

$file = $baseDir . "cadernos.json";

if (!file_exists($file)) {
    file_put_contents($file, "[]");
}

$caderno = [
    "id" => $id,
    "titulo" => $dados['titulo'] ?? "Novo caderno",
    "disciplina" => strtoupper($dados['disciplina'] ?? ""),
    "user_id" => $_SESSION['userID'],
    "ano" => $dados['ano'] ?? $_SESSION['ano'],
    "turmas" => $dados['turmas'] ?? [],
    "cor" => $dados['cor'] ?? "blue",
    "data" => date("Y-m-d H:i:s")
];

// 🔥 guardar JSON
$lista = json_decode(file_get_contents($file), true);
$lista[] = $caderno;

file_put_contents($file, json_encode($lista, JSON_PRETTY_PRINT), LOCK_EX);

echo json_encode($caderno);