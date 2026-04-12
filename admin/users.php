<?php

// 🔐 proteção
if (!isset($_SESSION['user'])) {
    header("Location: ../login.php");
    exit;
}

// 🔐 só admin
if ($_SESSION['user']['grupo'] !== 'admin') {
    exit("Acesso negado");
}

?>

<div class="box">

    <h2>Gestão de Utilizadores</h2>
    
    <div class="users-toolbar">
    
        <div class="users-sort">
            Ordenar por:
            <button onclick="ordenarUsers('id')">ID</button>
            <button onclick="ordenarUsers('nome')">Nome</button>
            <button onclick="ordenarUsers('AT')">AT</button>
        </div>
    
        <button class="btn-add-user" onclick="addUser()">
            ➕ Novo Utilizador
        </button>
    
    </div>

    <div id="users-table"></div>

</div>