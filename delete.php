<?php
session_start();

$pagina = isset($_GET['pagina']) ? intval($_GET['pagina']) : 0;

if ($pagina <= 0) exit;

require_once __DIR__ . "/helpers.php"; // ajusta se necessário

$letivo = getAnoLetivo();

$dir = __DIR__ . "/data/cadernos/" . $letivo . "/" . $_SESSION['userId'];

if (!is_dir($dir)) {
    mkdir($dir, 0777, true);
}

$file = $dir . "/pagina_" . $pagina . ".json";

if (file_exists($file)) {
    unlink($file);
}