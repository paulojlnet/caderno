<?php
// ⚠️ NÃO precisa de session_start aqui
?>

<div class="box">

    <h2>Importar utilizadores</h2>
    
    <a href="../data/users/modelo.csv" download>
        📥 Descarregar modelo CSV
    </a>
    
    <p style="font-size:12px;color:#666;">
    ⚠️ Guardar ficheiro como CSV UTF-8
    </p>
    
    <p style="font-size:12px;color:#666;">
    Nota: Campos vazios não são alterados
    </p>
    
    <br>
    
    <input type="file" id="csvFile" accept=".csv">
    <button onclick="previewCSV()">Pré-visualizar</button>
    
    <div id="preview-area" style="margin-top:20px;"></div>
    
    <button id="confirmBtn" onclick="confirmImport()" style="display:none;">
        ✔ Confirmar Importação
    </button>
    
    <div id="upload-status" style="display:none; margin-top:10px;">
        <span class="spinner"></span>
        A processar... por favor aguarde
    </div>

</div>