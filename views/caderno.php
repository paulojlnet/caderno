<?php
$tipo = 'pautado';
?>

<div class="container-folha">
    <img src="imagens/logoCadernoDigital.png" alt="Logo" id="logo">
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
            <a href="logout.php" id="btn-logout">Sair</a>
        </div>
    </div>

    <div id="menu-content">
        <!-- conteúdo vai aqui depois -->
        <button id="btn-sumario">Criar novo sumário</button>
        
        <div id="modo-toggle">
            <button id="btn-preview" class="ativo">Miniaturas</button>
            <button id="btn-sumarios">Sumários</button>
        </div>
        
        <div id="lista-sumarios" class="hidden"></div>        
        
        <div id="lista-paginas"></div>
    </div>
</div>

<div id="toolbar-global" style="display:none;">

	<button data-cmd="bold"><strong>N</strong></button>
    <button data-cmd="italic"><i>I</i></button>
	<button data-cmd="underline"><u>S</u></button>

    <span class="sep"></span>

	<button data-cmd="insertUnorderedList" class="btn-wide">• Lista</button>
	<button data-cmd="insertOrderedList" class="btn-wide">1. Ordem</button>

    <span class="sep"></span>

    <!-- 🔥 ALINHAMENTO -->
	<div class="align-group">
		<button data-cmd="justifyLeft"><span class="align left"></span></button>
		<button data-cmd="justifyCenter"><span class="align center"></span></button>
		<button data-cmd="justifyRight"><span class="align right"></span></button>
		<button data-cmd="justifyFull"><span class="align justify"></span></button>
	</div>
	
    <span class="sep"></span>

	<!-- BOTÕES -->
	<button id="btn-text-color" class="btn-color-text"><strong>A</strong></button>
	<button id="btn-bg-color" class="btn-color-bg">
		✏️
		<span></span>
	</button>

	<!-- PALETAS (hidden) -->
<div id="palette-text" class="palette hidden">

    <!-- 🔹 linha 1 (neutros / base) -->
    <div class="row">
        <span data-color="#000000" style="background:#000000"></span>
        <span data-color="#444444" style="background:#444444"></span>
        <span data-color="#1976d2" style="background:#1976d2"></span>
        <span data-color="#388e3c" style="background:#388e3c"></span>
        <span data-color="#f57c00" style="background:#f57c00"></span>
    </div>

    <!-- 🔹 linha 2 (cores vivas) -->
    <div class="row">
        <span data-color="#d32f2f" style="background:#d32f2f"></span>
        <span data-color="#7b1fa2" style="background:#7b1fa2"></span>
        <span data-color="#0288d1" style="background:#0288d1"></span>
        <span data-color="#0097a7" style="background:#0097a7"></span>
        <span data-color="#c2185b" style="background:#c2185b"></span>
    </div>

    <!-- 🔹 linha 3 (tons profundos) -->
    <div class="row">
        <span data-color="#1b5e20" style="background:#1b5e20"></span>
        <span data-color="#0d47a1" style="background:#0d47a1"></span>
        <span data-color="#4e342e" style="background:#4e342e"></span>
        <span data-color="#263238" style="background:#263238"></span>
        <span data-color="#bf360c" style="background:#bf360c"></span>
    </div>

</div>

<div id="palette-bg" class="palette hidden">

    <span data-color="#fff59d" style="background:#fff59d"></span>  <!-- amarelo -->
    <span data-color="#c8e6c9" style="background:#c8e6c9"></span>  <!-- verde -->
    <span data-color="#bbdefb" style="background:#bbdefb"></span>  <!-- azul -->
    <span data-color="#ffe0b2" style="background:#ffe0b2"></span>  <!-- laranja -->
    <span data-color="#f8bbd0" style="background:#f8bbd0"></span>  <!-- rosa -->

</div>

    <span class="sep"></span>

    <button data-cmd="removeFormat">Limpar</button>

</div>

<div id="delete-popup">
  <span>Apagar?</span>
  <button id="delete-ok">OK</button>
  <button id="delete-cancel">Cancelar</button>
</div>

<div id="caderno">
    <div id="viewport">
      <div id="canvas">
    
        <div id="caderno-wrapper">
            <div class="folha <?= $tipo ?>" id="folha">
                <div class="linha-vertical esquerda"></div>
                <div class="linha-vertical direita"></div>
                <div class="mascara-topo"></div>
                <div class="mascara-fundo"></div>
            </div>
        </div>
    
      </div>
    </div>
</div>

<div class="nav-page prev" id="btn-prev">
    ‹
</div>

<div class="nav-page next" id="btn-next">
    ›
</div>

<script>
window.userId = "<?= $_SESSION['userId'] ?>";
window.anoLetivo = "<?= getAnoLetivo() ?>";

function getCaminhoPagina() {
    return "data/cadernos/" + window.anoLetivo + "/" + window.userId + "/pagina_" + paginaAtual + ".json";
}
</script>