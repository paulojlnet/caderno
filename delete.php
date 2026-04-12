<?php
session_start();

$pagina = isset($_GET['pagina']) ? intval($_GET['pagina']) : 0;

if ($pagina <= 0) exit;

require_once __DIR__ . "/helpers.php"; // ajusta se necessário

$letivo = getAnoLetivo();

$cadernoID = $_GET['caderno'] ?? null;

if (!$cadernoID) exit;

$baseDir = __DIR__ . "/data/cadernos/" . $letivo . "/";
$dir = $baseDir . "professores/" . $_SESSION['userID'] . "/" . $cadernoID;

$file = $dir . "/pagina_" . $pagina . ".json";

if (file_exists($file)) {
    unlink($file);
}