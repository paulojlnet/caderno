<?php
session_start();

// 🔐 segurança
if (!isset($_SESSION['grupo']) || $_SESSION['grupo'] !== 'professor') {
    die("Sem permissão");
}

if (!isset($_GET['id'])) {
    die("ID não fornecido");
}

$id = $_GET['id'];

require_once __DIR__ . "/../helpers.php";

$letivo = $_SESSION['letivo'] ?? getAnoLetivo();

$baseDir = __DIR__ . "/../data/cadernos/" . $letivo . "/";
$file = $baseDir . "cadernos.json";

// 🔴 verificar se existe JSON
if (!file_exists($file)) {
    die("Sem dados");
}

$lista = json_decode(file_get_contents($file), true);

// 🔥 VERIFICAR SE TEM CONTEÚDO
$path = $baseDir . "professores/" . $_SESSION['userID'] . "/" . $id;

if (is_dir($path)) {

    $files = glob($path . "/pagina_*.json");

    foreach ($files as $f) {

        $conteudo = json_decode(file_get_contents($f), true);

        if (!empty($conteudo)) {
            echo json_encode(["erro" => "tem_conteudo"]);
            exit;
        }
    }
}

// 🔥 filtrar cadernos (remover o pretendido)
$novaLista = array_filter($lista, function($c) use ($id) {
    return !($c['id'] === $id && $c['user_id'] == $_SESSION['userID']);
});

// 🔥 guardar novamente
file_put_contents($file, json_encode(array_values($novaLista), JSON_PRETTY_PRINT), LOCK_EX);

// 🔥 apagar pasta física
$path = $baseDir . "professores/" . $_SESSION['userID'] . "/" . $id;

function apagarPasta($dir) {
    if (!is_dir($dir)) return;

    $files = scandir($dir);

    foreach ($files as $file) {
        if ($file === '.' || $file === '..') continue;

        $fullPath = $dir . '/' . $file;

        if (is_dir($fullPath)) {
            apagarPasta($fullPath);
        } else {
            unlink($fullPath);
        }
    }

    rmdir($dir);
}

apagarPasta($path);

echo "OK";