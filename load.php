<?php
session_start();

$userID = $_SESSION['userID'];
$pagina = isset($_GET['pagina']) ? intval($_GET['pagina']) : 1;

require_once __DIR__ . "/helpers.php"; // ajusta se necessário

$letivo = getAnoLetivo();

$dir = __DIR__ . "/data/cadernos/" . $letivo . "/" . $_SESSION['userID'];

$file = $dir . "/pagina_" . $pagina . ".json";

if (file_exists($file)) {
    echo file_get_contents($file);
} else {
    echo json_encode([]); // 🔥 importante
}