let paginaAtual = 1;
let mudarPagina = false;
var aCorrigir = false;

document.addEventListener("DOMContentLoaded", () => {

    $('#editor').summernote({
            dialogsInBody: true,
            lang: 'pt-PT',
            fontSizes: ['14', '16'], // 🔥 limite 24
            toolbar: [
                ['style', ['bold', 'italic', 'underline']],
                ['fontsize', ['fontsize']],
                ['para', ['paragraph']],
                ['color', ['color']],
                ['insert', ['link', 'picture', 'video']],
                ['view', ['codeview']],
              ],
        callbacks: {
    onInit: function() {
        const editor = document.querySelector('.note-editable');
        editor.innerHTML = '<p></p>';
    },

onChange: function(contents) {

    ajustarAlturaEditor();

    const htmlCorrigido = normalizarHTML(contents);
    const finalHTML = htmlCorrigido || contents;

    clearTimeout(window.saveTimeout);

    window.saveTimeout = setTimeout(function() {
        fetch("save.php?pagina=" + paginaAtual, {
            method: "POST",
            body: finalHTML
        });
    }, 1000);

    if (aCorrigir) return;

    // ❌ NÃO HÁ MAIS summernote('code') AQUI

    setTimeout(() => verificarPagina(), 0);
} 
}
    });
    

fetch("load.php?pagina=" + paginaAtual)
    .then(res => res.text())
    .then(data => {

        const htmlLimpo = normalizarHTML(data || "<p><br></p>");

        $('#editor').summernote('code', htmlLimpo);
    });
});

// 🔍 Verificar se a página está cheia
function verificarPagina() {
    const escalaAtual = window.escala || 1;
    console.log("verificarPagina chamada");
    const editor = document.querySelector('.note-editing-area');
    const folha = document.querySelector(".folha");

    const estilo = window.getComputedStyle(folha);

    const paddingTop = parseInt(estilo.paddingTop);
    const paddingBottom = parseInt(estilo.paddingBottom);

    // 🔥 altura útil REAL da folha
    const alturaUtil = folha.clientHeight - paddingTop - paddingBottom;

    // 🔥 ALTURA DE UMA LINHA REAL
    const linha = 35;

    // 🔥 DETEÇÃO CORRETA
    if (editor.scrollHeight >= (alturaUtil / escalaAtual) && !mudarPagina) {

        mudarPagina = true;

// 🔥 obter HTML atual
let html = $('#editor').summernote('code');

// criar DOM temporário
const div = document.createElement('div');
div.innerHTML = html;

// obter todos os parágrafos
const paragrafos = div.querySelectorAll('p');

if (paragrafos.length > 0) {
    const ultima = paragrafos[paragrafos.length - 1];
    const conteudoUltima = ultima.outerHTML;
    
    ultima.remove();
    
    const novoHTML = div.innerHTML;
    
    fetch("save.php?pagina=" + paginaAtual, {
        method: "POST",
        body: novoHTML
    }).then(() => {
    
        paginaAtual++;
    
        fetch("load.php?pagina=" + paginaAtual)
            .then(res => res.text())
            .then(data => {
    
                const novoConteudo = conteudoUltima + data;
    
                $('#editor').summernote('code', novoConteudo);
            });
    
    });
}

        setTimeout(() => {
            mudarPagina = false;
        }, 100);
    }
}

// 📄 Criar nova página
function novaPagina() {

const conteudo = $('#editor').summernote('code');

// 💾 Guardar página atual
fetch("save.php?pagina=" + paginaAtual, {
    method: "POST",
    body: conteudo
});

// ➡️ Próxima página
paginaAtual++;

// 📥 Carregar conteúdo da nova página
fetch("load.php?pagina=" + paginaAtual)
    .then(res => res.text())
.then(data => {

    let conteudo = data.trim();

    if (!conteudo) {
        conteudo = "<p><br></p>"; // 🔥 só uma linha vazia
    }

    $('#editor').summernote('code', conteudo);
});

}

function normalizarHTML(html) {

    const div = document.createElement('div');
    div.innerHTML = html;

    // 🔥 aplicar line-height
    div.querySelectorAll('p').forEach(p => {
        p.style.lineHeight = '35px';
    });

    // 🔥 remover múltiplos <p><br></p> no fim
    let paragrafos = div.querySelectorAll('p');

    for (let i = paragrafos.length - 1; i > 0; i--) {

        const atual = paragrafos[i];
        const anterior = paragrafos[i - 1];

        if (
            atual.innerText.trim() === '' &&
            anterior.innerText.trim() === ''
        ) {
            atual.remove(); // 🔥 remove duplicados
        } else {
            break;
        }
    }

    return div.innerHTML;
}

function colocarCursorNoFim() {
    const editor = document.querySelector('.note-editable');

    const range = document.createRange();
    const sel = window.getSelection();

    range.selectNodeContents(editor);
    range.collapse(false);

    sel.removeAllRanges();
    sel.addRange(range);
}

function ajustarAlturaEditor() {
    const editor = document.querySelector('.note-editable');

    if (!editor) return;

    editor.style.height = 'auto';
    editor.style.height = editor.scrollHeight + 'px';
}

document.addEventListener('keydown', function(e) {

    if (e.key === "ArrowDown") {

        const editor = document.querySelector('.note-editable');
        const paragrafos = editor.querySelectorAll('p');

        const ultimo = paragrafos[paragrafos.length - 1];

        if (ultimo && ultimo.innerText.trim() === "") {
            e.preventDefault(); // 🔥 bloqueia descida para linha vazia
        }
    }
});