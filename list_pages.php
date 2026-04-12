<?php
session_start();

require_once __DIR__ . "/helpers.php"; // ajusta se necessário

$letivo = getAnoLetivo();

$cadernoID = $_GET['caderno'] ?? null;

if (!$cadernoID) {
    die("Caderno não definido");
}

$baseDir = __DIR__ . "/data/cadernos/" . $letivo . "/";
$dir = $baseDir . "professores/" . $_SESSION['userID'] . "/" . $cadernoID;

$files = is_dir($dir) ? glob($dir . "/pagina_*.json") : [];

$paginas = [];

foreach ($files as $file) {
    preg_match('/pagina_(\d+)\.json/', $file, $m);
    $paginas[] = intval($m[1]);
}

sort($paginas);

echo json_encode($paginas);