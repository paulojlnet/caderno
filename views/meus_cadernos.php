<div class="container-folha">
    <img src="imagens/logoCadernoDigital.png" alt="Logo" id="logo">
</div>

<div style="padding:20px">

    <h2>Os meus cadernos</h2>

    <div id="lista-cadernos"></div>

</div>


<div id="menu-btn">☰</div>

<div id="menu-overlay"></div>

<div id="menu">
    <div id="menu-header">
        <span>Menu</span>
        <button id="menu-close">✕</button>
    </div>
    
    <div id="user-panel">
        <div class="user-info">
            <strong><?= $_SESSION['user']['nome'] ?? 'Utilizador' ?></strong><br>
            <span style="font-size:12px;opacity:0.7;">
                <?= $_SESSION['user']['grupo'] ?? '' ?>
            </span>
        </div>
    
        <div class="user-actions">
            <button id="btn-user-dados">Ver dados</button>
            <button id="btn-user-password">Alterar senha</button>
            <a href="logout.php" id="btn-logout">Terminar Sessão</a>
        </div>
    </div>

    <div id="menu-content">
        <!-- conteúdo vai aqui depois -->
	<button  id="btn-criar-caderno" onclick="abrirFormularioCaderno()">Criar caderno</button>

	<div class="menu-separador"></div>


	<div id="lista-cadernos-menu"></div>

    </div>
</div>

<script>
document.addEventListener("DOMContentLoaded", () => {
    if (typeof carregarCadernos === "function") {
        carregarCadernos();
    }
});
</script>