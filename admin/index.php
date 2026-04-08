<?php
session_start();

if (!isset($_SESSION['user']) || $_SESSION['user']['grupo'] !== 'admin') {
    header("Location: ../login.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>Área do Administrador</title>

    <link rel="stylesheet" href="../assets/css/app.css">



</head>

<body class="app">
    
<div class="container-folha">
    <img src="../imagens/logoCadernoDigital.png" alt="Logo" id="logo">
</div>

<!-- 🔥 BOTÃO MENU -->
<div id="menu-btn">☰</div>

<!-- 🔥 MENU -->
<div id="menu">

    <div id="menu-header">
        <span>Área do Administrador</span>
        <button id="menu-close">×</button>
    </div>

    <div id="user-panel">
        <strong><?= $_SESSION['user']['nome'] ?></strong><br>
        <span>Administrador</span>
    </div>

    <div id="admin-nav">

        <div class="menu-item" data-view="users">
            👥 Utilizadores
        </div>

        <div class="menu-item" data-view="import">
            📥 Importar utilizadores
        </div>

        <a href="../logout.php" class="menu-item logout">
            🚪 Sair
        </a>

    </div>

</div>

<!-- 🔥 OVERLAY -->
<div id="menu-overlay"></div>

<!-- 🔥 CONTEÚDO -->
<div id="admin-content">
    
    <div id="view-users" class="admin-view hidden">
        <?php include 'users.php'; ?>
    </div>
    
    <div id="view-import" class="admin-view">
        <?php include 'upload.php'; ?>
    </div>

</div>

<div id="toast-container"></div>

<div id="user-modal-overlay" class="hidden"></div>

<div id="user-modal" class="hidden">
    <div id="user-modal-content"></div>
</div>

<!-- 🔥 JS -->
<script src="../assets/js/admin.js"></script>

</body>
</html>