<?php
session_start();

require_once __DIR__ . "/helpers.php"; // ajusta se necessário

$letivo = getAnoLetivo();

$dir = __DIR__ . "/data/cadernos/" . $letivo . "/" . $_SESSION['userId'];

// 🔥 GARANTIR QUE A PASTA EXISTE (AQUI!)
if (!is_dir($dir)) {
    mkdir($dir, 0777, true);
}

$files = glob($dir . "/pagina_*.json");

$paginas = [];

foreach ($files as $file) {
    preg_match('/pagina_(\d+)\.json/', $file, $m);
    $paginas[] = intval($m[1]);
}

sort($paginas);

echo json_encode($paginas);