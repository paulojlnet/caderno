<?php
session_start();

if ($_SESSION['grupo'] !== 'professor') {
    die("Sem permissão");
}

$letivo = $_SESSION['letivo'];

$dados = json_decode(file_get_contents("php://input"), true);

// 🔥 garantir pasta
$dir = __DIR__ . "/../data/cadernos/$letivo/";

if (!is_dir($dir)) {
    mkdir($dir, 0777, true);
}

$file = $dir . "cadernos.json";

if (!file_exists($file)) {
    file_put_contents($file, "[]");
}

// 🔥 gerar ID
$id = uniqid("c");

$caderno = [
    "id" => $id,
    "titulo" => $dados['titulo'] ?? "Novo caderno",
    "disciplina" => strtolower($dados['disciplina'] ?? ""),
    "user_id" => $_SESSION['userID'],
    "ano" => $dados['ano'] ?? $_SESSION['ano'],
    "turmas" => [],
    "data" => date("Y-m-d H:i:s")
];

// 🔥 guardar JSON
$lista = json_decode(file_get_contents($file), true);
$lista[] = $caderno;

file_put_contents($file, json_encode($lista, JSON_PRETTY_PRINT), LOCK_EX);

// 🔥 criar pasta do professor
$path = __DIR__ . "/../data/cadernos/$letivo/professores/{$_SESSION['userID']}/$id/";

mkdir($path, 0777, true);

echo json_encode($caderno);