<?php
session_start();

header("Cache-Control: no-cache, no-store, must-revalidate");
header("Pragma: no-cache");
header("Expires: 0");

$data = file_get_contents("php://input");

// 🔥 caminho correto com base no utilizador
require_once __DIR__ . "/helpers.php";

$letivo = getAnoLetivo();

$cadernoID = $_GET['caderno'] ?? null;

if (!$cadernoID) {
    die("Caderno não definido");
}

$baseDir = __DIR__ . "/data/cadernos/" . $letivo . "/";
$dir = $baseDir . "professores/" . $_SESSION['userID'] . "/" . $cadernoID;

if (!is_dir($dir)) {
    mkdir($dir, 0777, true);
}

// ficheiro final
$pagina = isset($_GET['pagina']) ? intval($_GET['pagina']) : 1;

$file = $dir . "/pagina_" . $pagina . ".json";

// guardar
file_put_contents($file, $data);
