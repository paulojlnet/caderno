<?php
session_start();

require_once 'config.php';
require_once 'helpers.php';

// 🔐 proteger acesso
if (!isset($_SESSION['user'])) {
    header("Location: login.php");
    exit;
}

$user = $_SESSION['user'] ?? null;
$isAutor = ($_SESSION['autor'] ?? '') === 'sim';

?>
<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <link href="https://cdn.jsdelivr.net/npm/summernote@0.8.20/dist/summernote-lite.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/summernote@0.8.20/dist/summernote-lite.min.js"></script>
    <title>Caderno</title>

    <!-- CSS -->
    <link rel="stylesheet" href="assets/css/app.css?t=6">

    <!-- JS -->
    <script src="assets/js/app.js" defer></script>
    <script src="assets/js/json.js" defer></script>
</head>
<body class="app">

    <div id="app">

        <!-- Header -->
        <?php include 'views/header.php'; ?>

        <!-- Conteúdo principal -->
        <main id="content">
            <?php include 'views/caderno.php'; ?>
        </main>

        <!-- Overlay -->
        <div id="overlay" class="hidden"></div>

    </div>
    <div id="toast-container"></div>
</body>
</html>