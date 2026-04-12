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

<!-- 🔥 OVERLAY -->
<div id="menu-overlay"></div>

<!-- 🔥 MENU -->
<div id="menu">
    <div id="menu-header">
        <span>Menu</span>
        <button id="menu-close">✕</button>
    </div>
    
    <div id="user-panel">
        <div class="user-info">
            <strong><?= $_SESSION['user']['nome'] ?? 'Utilizador' ?></strong><br>
            <span style="font-size:12px;opacity:0.7;">
                Administrador
            </span>
        </div>
    
        <div class="user-actions">
            <button id="btn-user-dados">Ver dados</button>
            <button id="btn-user-password">Alterar senha</button>
            <a href="../logout.php" id="btn-logout">Terminar Sessão</a>
        </div>
    </div>

    <div id="menu-content">

        <div class="menu-item" data-view="users">
            👥 Utilizadores
        </div>

        <div class="menu-item" data-view="import">
            📥 Importar utilizadores
        </div>

    </div>
</div>

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