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

<div id="toolbar-global">
    <button data-cmd="bold"><b>B</b></button>
    <button data-cmd="italic"><i>I</i></button>
    <button data-cmd="underline"><u>U</u></button>

    <span class="sep"></span>

    <button data-cmd="insertUnorderedList">• Lista</button>
    <button data-cmd="insertOrderedList">1. Lista</button>

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