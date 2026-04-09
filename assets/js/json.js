let folha;
let isTouch = false;
let blocoParaApagar = null;
let pendingPosition = null;
let activeBlock = null;

document.addEventListener("focusin", (e) => {
    const bloco = e.target.closest(".bloco");
    if (bloco) {
        activeBlock = bloco;
    }
});

function limparBlocosInvalidos() {
    folha.querySelectorAll(".bloco").forEach(b => {
        if (b.dataset.valido !== "true") {
            b.remove();
        }
    });
}

function blocoVazio(bloco) {
    return bloco.innerHTML === "<p><br></p>" ||
           bloco.innerText.replace(/\u200B/g, "").trim() === "";
}

function limitarAltura(bloco) {
    
    const topoMask = folha.querySelector(".mascara-topo");
    const fundoMask = folha.querySelector(".mascara-fundo");
    
    const folhaRect = folha.getBoundingClientRect();
    
    const topo = topoMask.getBoundingClientRect().bottom - folhaRect.top;
    const fundo = fundoMask.getBoundingClientRect().top - folhaRect.top;
    
    const maxAltura = fundo - bloco.offsetTop;
    
    /**bloco.style.maxHeight = maxAltura + "px";**/
}

function atualizarEstadoBloco(bloco) {

    const texto = bloco.innerText.trim();

    if (texto === "") {
        bloco.classList.add("vazio");
    } else {
        bloco.classList.remove("vazio");
    }
}

function criarBlocoTexto(x, y) {
    const bloco = document.createElement("div");
    const larguraFolha = 1100;
    const margemDireita = 62;

    bloco.className = "bloco texto";
    bloco.contentEditable = true;
    bloco.spellcheck = false;

    bloco.style.left = x + "px";
    bloco.style.top = y + "px";
    let largura = larguraFolha - x - margemDireita;

    if (largura < 50) largura = 50;
    
    bloco.style.width = largura + "px";

    bloco.innerHTML = "<p><br></p>";
    bloco.dataset.tipo = "texto";
    bloco.dataset.valido = "false";
    
    folha.appendChild(bloco);
    
    limitarAltura(bloco);
    
    bloco.addEventListener("focus", () => {
    
        folha.querySelectorAll(".bloco").forEach(b => b.classList.remove("ativo"));
        bloco.classList.add("ativo");
    
    });

    bloco.addEventListener("blur", () => {
    
        bloco.classList.remove("ativo");
    
        if (bloco.dataset.valido !== "true") {
            if (document.body.contains(bloco)) {
                bloco.remove();
                guardarPagina();
            }
        }
    });
    
    bloco.addEventListener("paste", function(e) {
    
        e.preventDefault();
    
        let texto = (e.clipboardData || window.clipboardData).getData("text");
    
        document.execCommand("insertText", false, texto);
    
    
    });    
    const dragHandle = document.createElement("div");
    
    const deleteBtn = document.createElement("div");
    deleteBtn.className = "delete-handle";
    /*deleteBtn.innerHTML = "✕";*/
    deleteBtn.textContent = "✖";
    deleteBtn.contentEditable = false;
    
    bloco.appendChild(deleteBtn);
    
    // 🔥 ação apagar
    deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
    
        const popup = document.getElementById("delete-popup");
        const rect = deleteBtn.getBoundingClientRect();
    
        blocoParaApagar = bloco;
    
        popup.style.display = "block";
        
        const popupWidth = 140; // ajusta se necessário
        
        let left = window.scrollX + rect.right + 10;
        
        // 🔥 se sair do ecrã → posiciona à esquerda do botão
        if (left + popupWidth > window.innerWidth) {
            left = window.scrollX + rect.left - popupWidth - 10;
        }
        
        // 🔥 evitar sair do lado esquerdo
        if (left < 10) left = 10;
        
        popup.style.left = left + "px";        
        
        popup.style.top = (window.scrollY + rect.top) + "px";
    });

    dragHandle.className = "drag-handle";
    dragHandle.contentEditable = false;
    dragHandle.innerHTML = "⠿";
    
    bloco.appendChild(dragHandle);

    // 🔥 resize handle
    const handle = document.createElement("div");
    handle.className = "resize-handle";
    handle.contentEditable = false; // 🔥 CRÍTICO
    bloco.appendChild(handle);
    
    ativarDrag(bloco); // 🔥 AQUI (depois de criar)
    ativarResize(bloco);

    // foco
    setTimeout(() => {
    
        bloco.focus();
    
        const range = document.createRange();
        const sel = window.getSelection();
    
        const p = bloco.querySelector("p");
    
        if (p) {
            range.setStart(p, 0);
            range.collapse(true);
        }
    
        if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
        }
        
        atualizarEstadoBloco(bloco);
    
    }, 0);
    
}

function criarBlocoSumario(x, y, licao, data, texto) {

    const paddingTop = 90;
    const linha = 35;

    // 🔥 SNAP (FALTAVA ISTO)
    y = paddingTop + Math.round((y - paddingTop) / linha) * linha;

    const paddingLeft = 97;
    const margemDireita = 62;
    const larguraFolha = 1100;
    
    // 🔥 ignorar X do clique
    criarBlocoTexto(paddingLeft, y);
    
    const blocos = folha.querySelectorAll(".bloco");
    const bloco = blocos[blocos.length - 1];
    
    // 🔥 largura total
    bloco.style.left = paddingLeft + "px";
    bloco.style.width = (larguraFolha - paddingLeft - margemDireita) + "px";

    bloco.classList.add("sumario");
    bloco.dataset.tipo = "sumario";

    bloco.innerHTML =
        '<div class="sumario-linha topo">' +
            '<span>Lição n.º ' + licao + '</span>' +
            '<span class="direita">' + formatarData(data) + '</span>' +
        '</div>' +
    
        '<div class="sumario-linha titulo"><strong>Sumário:</strong></div>' +
    
        '<div class="sumario-linha">' + texto.split("\n").join('</div><div class="sumario-linha">') + '</div>';

    bloco.dataset.tipo = "sumario";
    bloco.dataset.valido = "true";

    folha.appendChild(bloco);

    // 🔥 DELETE HANDLE
    const deleteBtn = document.createElement("div");
    deleteBtn.className = "delete-handle";
    deleteBtn.textContent = "✖";
    deleteBtn.contentEditable = false;
    bloco.appendChild(deleteBtn);

    deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();

        const popup = document.getElementById("delete-popup");
        const rect = deleteBtn.getBoundingClientRect();

        blocoParaApagar = bloco;

        popup.style.display = "block";
        popup.style.left = (window.scrollX + rect.left) + "px";
        popup.style.top = (window.scrollY + rect.top) + "px";
    });

    // 🔥 DRAG HANDLE
    const dragHandle = document.createElement("div");
    dragHandle.className = "drag-handle";
    dragHandle.innerHTML = "⠿";
    dragHandle.contentEditable = false;
    bloco.appendChild(dragHandle);

    // 🔥 ATIVAR DRAG
    ativarDrag(bloco);

    guardarPagina();
}

function guardarPagina() {

    const blocos = folha.querySelectorAll(".bloco");
    const dados = [];

    const larguraFolha = folha.clientWidth || 1100;

    // 🔥 invalidar cache desta página
    delete thumbCache[paginaAtual];
    delete thumbCache[paginaAtual + 1]; // 🔥 também próxima (pode mudar)

    blocos.forEach(bloco => {

        const clone = bloco.cloneNode(true);

        // 🔥 remover handles
        clone.querySelectorAll(".resize-handle").forEach(el => el.remove());
        clone.querySelectorAll(".drag-handle").forEach(el => el.remove());
        clone.querySelectorAll(".delete-handle").forEach(el => el.remove());

        // 🔥 conteúdo limpo
        let conteudoLimpo = clone.innerText.trim();

        if (!conteudoLimpo) {
            conteudoLimpo = clone.textContent.trim();
        }

        if (!bloco.classList.contains("sumario")) {
            if (!conteudoLimpo.replace(/\s/g, "")) return;
        }

        const posX = parseInt(bloco.style.left || 0);
        const posY = parseInt(bloco.style.top || 0);
        const largura = bloco.offsetWidth || 300;

        dados.push({
            tipo: bloco.classList.contains("sumario") ? "sumario" : "texto",
            x: posX / larguraFolha,
            y: posY,
            width: largura / larguraFolha,
            conteudo: clone.innerHTML
        });
    });

    fetch("save.php?pagina=" + paginaAtual, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dados)
    })
    .then(() => {

        const atualTem = paginaTemConteudo(dados);

        // 🔥 verificar próxima página
        fetch(getCaminhoPaginaNumero(paginaAtual + 1))
        .then(res => res.ok ? res.json() : [])
        .then(proxima => {

            const proxTem = paginaTemConteudo(proxima);

            let precisaAtualizar = false;

            // 🔥 CRIAR PRÓXIMA PÁGINA
            const criarProxima = (atualTem && !proxTem)
                ? fetch("save.php?pagina=" + (paginaAtual + 1), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify([])
                }).then(() => {
                    precisaAtualizar = true;
                })
                : Promise.resolve();

            criarProxima.then(() => {

                // 🔥 VERIFICAR REMOÇÃO
                fetch("list_pages.php")
                .then(res => res.json())
                .then(paginas => {

                    if (!Array.isArray(paginas) || paginas.length < 2) {
                        if (precisaAtualizar) renderPaginas();
                        return;
                    }

                    paginas.sort((a, b) => a - b);

                    const ultima = paginas[paginas.length - 1];
                    const penultima = paginas[paginas.length - 2];

                    if (paginaAtual !== ultima && paginaAtual !== penultima) {
                        if (precisaAtualizar) renderPaginas();
                        return;
                    }

                    Promise.all([
                        fetch(getCaminhoPaginaNumero(ultima)).then(r => r.ok ? r.json() : []),
                        fetch(getCaminhoPaginaNumero(penultima)).then(r => r.ok ? r.json() : [])
                    ])
                    .then(([dadosUltima, dadosPenultima]) => {

                        const ultimaVazia = !paginaTemConteudo(dadosUltima);
                        const penultimaVazia = !paginaTemConteudo(dadosPenultima);

                        // 🔥 REMOVER ÚLTIMA SE DUPLICADA VAZIA
                        if (ultimaVazia && penultimaVazia) {

                            fetch("delete.php?pagina=" + ultima)
                            .then(() => {
                                renderPaginas();
                            });

                        } else {
                            if (precisaAtualizar) renderPaginas();
                        }

                    });

                });

            });

        });

    })
    .catch(() => {});
}

function carregarPagina() {
    fetch(getCaminhoPagina() + "?t=" + Date.now())
    .then(res => res.ok ? res.json() : []) // 🔥 CRÍTICO
    .catch(() => [])
    .then(dados => {
        
        if (!Array.isArray(dados)) dados = [];

        // 🔥 largura base
        const larguraFolha = 1100;
    
        // 🔥 remover apenas blocos
        folha.querySelectorAll(".bloco").forEach(b => b.remove());
    
        dados.forEach(el => {
    
            if (el.tipo === "texto" || el.tipo === "sumario") {
    
                const bloco = document.createElement("div");
    
                bloco.className = "bloco " + el.tipo;
                bloco.contentEditable = true;
                bloco.spellcheck = false;

                bloco.style.top = el.y + "px";

                // 🔥 compatível com dados antigos e novos
                bloco.style.left = (el.x <= 1 ? el.x * larguraFolha : el.x) + "px";
                bloco.style.width = (el.width <= 1 ? el.width * larguraFolha : el.width) + "px";

                bloco.innerHTML = el.conteudo;
                bloco.dataset.tipo = el.tipo;
                bloco.dataset.valido = "true"; // 🔥 ESSENCIAL
                
                // 🔥 MARCAR SUMÁRIO PARA SCROLL
                if (el.tipo === "sumario") {
                    bloco.dataset.sumarioId = el.y;
                }
    
                folha.appendChild(bloco);
                
                limitarAltura(bloco);
                atualizarEstadoBloco(bloco);
                
                bloco.addEventListener("focus", () => {
                    folha.querySelectorAll(".bloco").forEach(b => b.classList.remove("ativo"));
                    bloco.classList.add("ativo");
                });
                
                bloco.addEventListener("blur", () => {
                
                    bloco.classList.remove("ativo");
                
                    if (bloco.dataset.valido !== "true") {
                        if (document.body.contains(bloco)) {
                            bloco.remove();
                            guardarPagina();
                        }
                    }
                });

                // 🔥 drag handle
                const dragHandle = document.createElement("div");
                
                const deleteBtn = document.createElement("div");
                deleteBtn.className = "delete-handle";
               /*deleteBtn.innerHTML = "✕";*/
                deleteBtn.textContent = "✖";
                deleteBtn.contentEditable = false;
                
                bloco.appendChild(deleteBtn);
                
                deleteBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                
                    const popup = document.getElementById("delete-popup");
                    const rect = deleteBtn.getBoundingClientRect();
                
                    blocoParaApagar = bloco;
                
                    popup.style.display = "block";
                    
                    const popupWidth = 170;
                    const popupHeight = 40; // aproximado
                    
                    let left = window.scrollX + rect.right - popupWidth;
                    let top = window.scrollY + rect.top - popupHeight - 10;
                    
                    // 🔥 evitar sair do lado direito
                    if (left + popupWidth > window.innerWidth) {
                        left = window.innerWidth - popupWidth - 10;
                    }
                    
                    // 🔥 evitar sair do lado esquerdo
                    if (left < 10) left = 10;
                    
                    // 🔥 evitar sair do topo
                    if (top < 10) {
                        top = window.scrollY + rect.bottom + 10;
                    }
                    
                    popup.style.left = left + "px";
                    popup.style.top = top + "px";                    
                });
                
                dragHandle.className = "drag-handle";
                dragHandle.contentEditable = false;
                dragHandle.innerHTML = "⠿";
                bloco.appendChild(dragHandle);
                
                // 🔥 resize handle
                if (el.tipo !== "sumario") {
                    const handle = document.createElement("div");
                    handle.className = "resize-handle";
                    handle.contentEditable = false;
                    bloco.appendChild(handle);
                }
                
                // 🔥 ativar
                ativarDrag(bloco);
                if (el.tipo !== "sumario") {
                    ativarResize(bloco);
                }
            }
        });
        
        atualizarBotoesNavegacao();
		
		if (typeof mostrarIndicadorPagina === "function") {
			mostrarIndicadorPagina();
		}
        
        // 🔥 FORÇAR SCROLL NO FIM DO RENDER
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.scrollTo(0, 0);
            });
        });
    
    });

}

let saveTimeout;

document.addEventListener("DOMContentLoaded", () => {
	
	esconderToolbar();

    folha = document.getElementById("folha");
    if (!folha) return;

    // ✅ POINTER (mobile)
    let touchTimeout = null;
    
    folha.addEventListener("touchstart", function(e) {
    
        limparBlocosInvalidos();
    
        const touch = e.touches[0];
    
        touchTimeout = setTimeout(() => {
    
            const { x, y } = getPointerPosition(e);
    
            criarBlocoComRegras(x, y);
    
        }, 250);
    });

    folha.addEventListener("touchmove", function() {
        clearTimeout(touchTimeout);
    });

    folha.addEventListener("touchend", function() {
        clearTimeout(touchTimeout);
    });

    // ✅ CLICK (desktop)
    folha.addEventListener("click", function(e) {
    
        const { x, y } = getPointerPosition(e);
    
        // 🔥 MODO SUMÁRIO TEM PRIORIDADE
        if (window.modoSumario) {
    
            window.modoSumario = false;
            document.body.classList.remove("modo-sumario");
    
            // remover indicador
            const indicador = document.getElementById("indicador-sumario");
            if (indicador) indicador.remove();
    
            window.posicaoSumario = { x, y };
    
            abrirFormularioSumario();
            return;
        }
    
        // 🔥 comportamento normal só depois
        if (e.target.closest(".bloco")) return;
    
        limparBlocosInvalidos();
        criarBlocoComRegras(x, y);
    });

    // ✅ INPUT
    folha.addEventListener("input", function(e) {

        const bloco = e.target.closest(".bloco");

        if (bloco) {
        
            atualizarEstadoBloco(bloco);
        
            if (!blocoVazio(bloco)) {
                bloco.dataset.valido = "true";
            }
        }

        clearTimeout(saveTimeout);

        saveTimeout = setTimeout(() => {
            guardarPagina();
        }, 500);
    });

    folha = document.getElementById("folha");
    if (!folha) return;
});

function ativarDrag(bloco) {

    const handle = bloco.querySelector(".drag-handle");
    if (!handle) return;

    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    function iniciar(e) {

        isDragging = true;
        
        bloco.classList.add("dragging");

        window.getSelection().removeAllRanges();

        const rect = bloco.getBoundingClientRect();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        offsetX = clientX - rect.left;
        offsetY = 0;

        document.addEventListener("mousemove", mover);
        document.addEventListener("mouseup", parar);

        document.addEventListener("touchmove", mover, { passive: false });
        document.addEventListener("touchend", parar);

        e.preventDefault();
    }

    function mover(e) {
        if (!isDragging) return;
    
        const folhaRect = folha.getBoundingClientRect();
    
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
        let x = clientX - folhaRect.left - offsetX;
        let y = clientY - folhaRect.top - offsetY;
    
        if (e.cancelable) e.preventDefault();
    
        const limiteEsquerdo = 95;
        const limiteDireito = 1100 - 62;
    
        // 🔥 medir uma vez (usar SEMPRE isto)
        const largura = bloco.offsetWidth;
        const altura = bloco.offsetHeight;

        // 🔥 substituir offsetWidth
        x = Math.min(limiteDireito - largura, x);
        x = Math.max(limiteEsquerdo, x);
    
        const topoMask = folha.querySelector(".mascara-topo");
        const fundoMask = folha.querySelector(".mascara-fundo");
    
        const topoMaskBottom = topoMask.getBoundingClientRect().bottom;
        const fundoMaskTop = fundoMask.getBoundingClientRect().top;
    
        const limiteSuperior = topoMaskBottom - folhaRect.top;
        const limiteInferior = fundoMaskTop - folhaRect.top - altura;
    
        y = Math.min(limiteInferior, y);
        y = Math.max(limiteSuperior, y);
    
        const linha = 35;
        const paddingTop = 90;
        
        const yRel = y - paddingTop;
        const linhaIndex = Math.floor((yRel + linha / 2) / linha);
        
        y = paddingTop + linhaIndex * linha;
        
        bloco.style.left = x + "px";
        bloco.style.top = y + "px";
    }

    function parar() {
        isDragging = false;
        
        bloco.classList.remove("dragging");

        document.removeEventListener("mousemove", mover);
        document.removeEventListener("mouseup", parar);

        document.removeEventListener("touchmove", mover);
        document.removeEventListener("touchend", parar);

        guardarPagina();
    }

    handle.addEventListener("mousedown", iniciar);
    handle.addEventListener("touchstart", iniciar, { passive: false });
}

function ativarResize(bloco) {

    const handle = bloco.querySelector(".resize-handle");
    if (!handle) return;

    let isResizing = false;

    function iniciar(e) {

        isResizing = true;

        // 🔥 impedir drag
        e.stopPropagation();

        document.addEventListener("mousemove", mover);
        document.addEventListener("mouseup", parar);

        document.addEventListener("touchmove", mover, { passive: false });
        document.addEventListener("touchend", parar);

        e.preventDefault();
    }

    function mover(e) {
        if (!isResizing) return;

        const folhaRect = folha.getBoundingClientRect();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;

        let novoWidth = clientX - folhaRect.left - bloco.offsetLeft;

        const larguraMin = 50;
        const larguraMax = 1100 - bloco.offsetLeft - 62;

        novoWidth = Math.max(larguraMin, novoWidth);
        novoWidth = Math.min(larguraMax, novoWidth);

        bloco.style.width = novoWidth + "px";
        
        // 🔥 atualizar altura
        limitarAltura(bloco);

        if (e.cancelable) e.preventDefault();
    }

    function parar() {
        isResizing = false;

        document.removeEventListener("mousemove", mover);
        document.removeEventListener("mouseup", parar);

        document.removeEventListener("touchmove", mover);
        document.removeEventListener("touchend", parar);

        guardarPagina();
    }

    handle.addEventListener("mousedown", iniciar);
    handle.addEventListener("touchstart", iniciar, { passive: false });
}

document.addEventListener("click", function(e) {

    // 🔥 1. BOTÕES DE COR (POSICIONAMENTO)
    const btnText = e.target.closest("#btn-text-color");
	if (btnText) {

        const palette = document.getElementById("palette-text");
        const rect = e.target.getBoundingClientRect();

        palette.style.left = rect.left + "px";
        palette.style.top = (rect.bottom + 5) + "px";
		palette.style.left = rect.left + "px";

        document.getElementById("palette-text").classList.add("hidden");
		document.getElementById("palette-bg").classList.add("hidden");

		palette.classList.remove("hidden");
		
        document.getElementById("palette-bg").classList.add("hidden");
        return;
    }

    const btnBg = e.target.closest("#btn-bg-color");
	if (btnBg) {

        const palette = document.getElementById("palette-bg");
        const rect = e.target.getBoundingClientRect();

        palette.style.left = rect.left + "px";
        palette.style.top = (rect.bottom + window.scrollY + 5) + "px";

        palette.classList.remove("hidden");
        document.getElementById("palette-text").classList.add("hidden");
        return;
    }

    // 🔥 4. BOTÕES NORMAIS (bold, italic, etc.)
	const btn = e.target.closest("#toolbar-global button");

	if (btn) {

		if (!btn.closest("#btn-text-color") && !btn.closest("#btn-bg-color")) {
			document.getElementById("palette-text").classList.add("hidden");
			document.getElementById("palette-bg").classList.add("hidden");
		}

		const cmd = btn.dataset.cmd;

		if (cmd) {
			document.execCommand(cmd, false, null);

			// 🔥 AQUI (CRÍTICO)
			atualizarToolbarEstado();
		}

		return;
	}
	
    if (!btn) return;

    const cmd = btn.dataset.cmd;

    if (cmd) {
        document.execCommand(cmd, false, null);
    }
	
    if (!e.target.closest("#toolbar-global") && !e.target.closest(".palette")) {
        document.getElementById("palette-text").classList.add("hidden");
        document.getElementById("palette-bg").classList.add("hidden");
    }

});

// ==========================
// TOOLBAR TIPO NOTION
// ==========================

document.addEventListener("selectionchange", () => {

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);

    const node = selection.anchorNode;
    if (!node) return;

    const bloco = node.nodeType === 3
        ? node.parentElement.closest(".bloco")
        : node.closest(".bloco");

    // ❌ fora de bloco
    if (!bloco) {
        esconderToolbar();
        return;
    }

    // 🎯 CASO 1: TEXTO SELECIONADO
    if (!selection.isCollapsed) {
        mostrarToolbar(range);
        atualizarToolbarEstado();
        return;
    }

    // 🎯 CASO 2: APENAS CURSOR (SEM SELEÇÃO)
    esconderToolbar();

    // 🔥 CORREÇÃO DE HERANÇA DE FORMATAÇÃO

    if (node.nodeType !== 3) return;

    // cursor no fim do texto
    if (selection.anchorOffset !== node.length) return;

    const parent = node.parentElement;
    if (!parent) return;

});


function mostrarToolbar(range) {

    const toolbar = document.getElementById("toolbar-global");
    if (!toolbar) return;

    const rect = range.getBoundingClientRect();

    const largura = 320; // igual ao CSS

    let left = window.scrollX + rect.left + rect.width / 2 - largura / 2;
    let top = window.scrollY + rect.top - 70;

    // 🔥 evitar sair do ecrã
    if (left < 10) left = 10;
    if (left + largura > window.innerWidth) {
        left = window.innerWidth - largura - 10;
    }

    toolbar.style.left = left + "px";
    toolbar.style.top = top + "px";
    toolbar.style.display = "flex";
	document.getElementById("palette-text").classList.add("hidden");
	document.getElementById("palette-bg").classList.add("hidden");
}


function esconderToolbar() {
    const toolbar = document.getElementById("toolbar-global");
    if (!toolbar) return;

    toolbar.style.display = "none";
}

function atualizarToolbarEstado() {

    const toolbar = document.getElementById("toolbar-global");
    if (!toolbar) return;

    const comandos = [
        { cmd: "bold", selector: '[data-cmd="bold"]' },
        { cmd: "italic", selector: '[data-cmd="italic"]' },
        { cmd: "underline", selector: '[data-cmd="underline"]' },
        { cmd: "justifyLeft", selector: '[data-cmd="justifyLeft"]' },
        { cmd: "justifyCenter", selector: '[data-cmd="justifyCenter"]' },
        { cmd: "justifyRight", selector: '[data-cmd="justifyRight"]' },
        { cmd: "justifyFull", selector: '[data-cmd="justifyFull"]' }
    ];

    comandos.forEach(c => {
        const btn = toolbar.querySelector(c.selector);
        if (!btn) return;

        if (document.queryCommandState(c.cmd)) {
            btn.classList.add("ativo");
        } else {
            btn.classList.remove("ativo");
        }
    });
}

document.getElementById("delete-ok").onclick = () => {
    if (blocoParaApagar) {
        blocoParaApagar.remove();
        guardarPagina();
    }
    esconderDeletePopup();
};

document.getElementById("delete-cancel").onclick = esconderDeletePopup;

function esconderDeletePopup() {
    const popup = document.getElementById("delete-popup");
    if (!popup) return;

    popup.style.display = "none";
    blocoParaApagar = null;
}

document.addEventListener("click", function(e) {

    const popup = document.getElementById("delete-popup");
    if (!popup || popup.style.display === "none") return;

    const clicouNoPopup = e.target.closest("#delete-popup");
    const clicouNoDelete = e.target.closest(".delete-handle");

    // 🔥 se clicou fora → fechar
    if (!clicouNoPopup && !clicouNoDelete) {
        esconderDeletePopup();
    }
});

document.addEventListener("keydown", function(e) {

    if (e.key !== "Escape") return;

    // 🔥 1. CANCELAR MODO SUMÁRIO (PRIORIDADE)
    if (window.modoSumario) {

        window.modoSumario = false;
        window.posicaoSumario = null;

        document.body.classList.remove("modo-sumario");

        const indicador = document.getElementById("indicador-sumario");
        if (indicador) indicador.remove();

        return; // 🔥 IMPORTANTE (não continuar)
    }

    // 🔥 2. FECHAR POPUP DELETE
    const popup = document.getElementById("delete-popup");
    if (popup && popup.style.display !== "none") {
        esconderDeletePopup();
        return;
    }
});

document.addEventListener("beforeinput", function(e) {

    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    if (!selection.isCollapsed) return;

    const node = selection.anchorNode;
    if (!node || node.nodeType !== 3) return;

    const offset = selection.anchorOffset;

	// 🔥 só quando está no fim
	if (offset !== node.length) return;

	// 🔥 só texto normal
	if (e.inputType !== "insertText") return;

	const parent = node.parentElement;
	if (!parent) return;

	const bloco = parent.closest(".bloco");
	if (!bloco) return;

	// 🔥 verificar se está dentro de formatação
	const formatado = parent.closest("font, b, strong, i, em, u, span");
	if (!formatado) return;

	const texto = e.data ?? "";
	if (!texto) return;

	e.preventDefault();

	// 🔥 criar nó limpo
	const textoNovo = document.createTextNode(texto);

    // 🔥 inserir depois do bloco formatado COMPLETO
	let topo = formatado;
	while (topo.parentElement && topo.parentElement !== bloco) {
		topo = topo.parentElement;
	}

	// 🔥 encontrar o <p>
	let p = topo.closest("p");

	// fallback (segurança)
	if (!p) {
		p = bloco;
	}

	// 🔥 inserir no ponto correto usando Range
	const range = selection.getRangeAt(0);

	// 🔥 se o topo já for filho direto do <p>, usa o topo
	if (topo.parentElement === p) {
		range.setStartAfter(topo);
	} else {
		// 🔥 senão, sai só da formatação interna (não do <p>)
		range.setStartAfter(formatado);
	}

	range.collapse(true);

	// inserir texto limpo
	range.insertNode(textoNovo);

	// 🔥 mover cursor para depois do texto
	range.setStartAfter(textoNovo);
	range.collapse(true);

	selection.removeAllRanges();
	selection.addRange(range);
});

function existeColisao(x, y, largura, altura, ignorarBloco = null) {

    const blocos = folha.querySelectorAll(".bloco");

    for (let b of blocos) {

        if (b === ignorarBloco) continue;
        if (blocoVazio(b)) continue;

        const bx = parseInt(b.style.left) || 0;
        const by = parseInt(b.style.top) || 0;
        const bw = b.offsetWidth;
        const bh = b.offsetHeight;

        const sobrepoe =
            x < bx + bw &&
            x + largura > bx &&
            y < by + bh - 1 &&
            y + altura > by + 1;

        if (sobrepoe) return true;
    }

    return false;
}

// 🔥 COR TEXTO
document.querySelectorAll("#palette-text span").forEach(el => {
    el.addEventListener("mousedown", function(e) {

        e.preventDefault(); // 🔥 mantém seleção

        document.execCommand("foreColor", false, this.dataset.color);

        document.getElementById("palette-text").classList.add("hidden");
    });
});

// 🔥 COR FUNDO
document.querySelectorAll("#palette-bg span").forEach(el => {
    el.addEventListener("mousedown", function(e) {

        e.preventDefault(); // 🔥 mantém seleção

        document.execCommand("hiliteColor", false, this.dataset.color);
		
		document.querySelector("#btn-bg-color span").style.background = this.dataset.color;

        document.getElementById("palette-bg").classList.add("hidden");
    });
});