const thumbCache = {};
let paginaAtual = 1;
let paginasCache = [];
window.modoSumario = false;
window.posicaoSumario = null;
let viewportScrollLeft = 0;
let renderSumariosToken = 0;
let mudouPagina = false;
let pageIndicatorTimeout;

function mostrarIndicadorPagina() {

    let el = document.getElementById("page-indicator");

    if (!el) {
        el = document.createElement("div");
        el.id = "page-indicator";
        el.className = "page-indicator";
        document.body.appendChild(el);
    }

    el.textContent = "Página " + paginaAtual;

    // reset estado
    el.style.opacity = "0";

    clearTimeout(pageIndicatorTimeout);

    // fade in
    requestAnimationFrame(() => {
        el.style.opacity = "1";
    });

    // fade out
    pageIndicatorTimeout = setTimeout(() => {
        el.style.opacity = "0";
    }, 1000);
}

function inserirPagina(paginaBase) {

    fetch("list_pages.php")
    .then(res => res.json())
    .then(paginas => {

        paginas.sort((a, b) => b - a); // 🔥 importante (de trás para a frente)

        const promessas = [];

        paginas.forEach(p => {

            if (p > paginaBase) {

                promessas.push(
                    fetch(getCaminhoPaginaNumero(p))
                    .then(r => r.ok ? r.json() : [])
                    .then(dados => {

                        return fetch("save.php?pagina=" + (p + 1), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(dados)
                        });

                    })
                );
            }

        });

        Promise.all(promessas).then(() => {

            // 🔥 criar nova página vazia
            fetch("save.php?pagina=" + (paginaBase + 1), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify([])
            })
            .then(() => {

                renderPaginas();

                // 🔥 ir para a nova página
                paginaAtual = paginaBase + 1;
                carregarPagina();

            });

        });

    });
}

function apagarPagina(paginaRemover) {

    fetch("list_pages.php")
    .then(res => res.json())
    .then(paginas => {

        paginas.sort((a, b) => a - b);

        const ultima = paginas[paginas.length - 1];

        // 🔥 segurança: nunca apagar última
        if (paginaRemover === ultima) return;

        // 🔥 carregar dados da página
        fetch(getCaminhoPaginaNumero(paginaRemover))
        .then(r => r.ok ? r.json() : [])
        .then(dados => {

            // 🔥 segurança: só apagar se vazia
            if (paginaTemConteudo(dados)) return;

            // 🔥 SHIFT: mover páginas seguintes para trás
            const promessas = [];

            paginas.forEach(p => {

                if (p > paginaRemover) {

                    promessas.push(
                        fetch(getCaminhoPaginaNumero(p))
                        .then(r => r.ok ? r.json() : [])
                        .then(dadosP => {

                            return fetch("save.php?pagina=" + (p - 1), {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(dadosP)
                            });

                        })
                    );
                }

            });

            Promise.all(promessas).then(() => {

                // 🔥 apagar última (duplicada após shift)
                fetch("delete.php?pagina=" + ultima)
                .then(() => {

                    // 🔥 ajustar página atual
                    if (paginaAtual > paginaRemover) {
                        paginaAtual--;
                    }

                    // 🔥 limpar cache
                    for (let k in thumbCache) {
                        delete thumbCache[k];
                    }

                    // 🔥 atualizar UI
                    renderPaginas();
                    carregarPagina();

                });

            });

        });

    });
}

function bloquearViewport() {
    const viewport = document.getElementById("viewport");
    if (!viewport) return;

    viewportScrollLeft = viewport.scrollLeft;

    viewport.classList.add("locked");

    // 🔥 manter posição
    viewport.scrollLeft = viewportScrollLeft;
}

function desbloquearViewport() {
    const viewport = document.getElementById("viewport");
    if (!viewport) return;

    viewport.classList.remove("locked");

    // 🔥 restaurar posição
    viewport.scrollLeft = viewportScrollLeft;
}

function atualizarBotoesNavegacao() {

    const btnPrev = document.getElementById("btn-prev");
    const btnNext = document.getElementById("btn-next");

    if (!btnPrev || !btnNext) return;

    // 🔥 se ainda não há páginas carregadas → esconder tudo
    if (!Array.isArray(paginasCache) || paginasCache.length === 0) {
        btnPrev.style.display = "none";
        btnNext.style.display = "none";
        return;
    }

    // 🔥 garantir ordem correta
    const paginas = [...paginasCache].sort((a, b) => a - b);

    const primeira = paginas[0];
    const ultima = paginas[paginas.length - 1];

    // 🔴 botão anterior
    if (paginaAtual <= primeira) {
        btnPrev.style.display = "none";
    } else {
        btnPrev.style.display = "flex";
    }

    // 🔴 botão seguinte
    if (paginaAtual >= ultima) {
        btnNext.style.display = "none";
    } else {
        btnNext.style.display = "flex";
    }
}

function paginaTemConteudo(dados) {
    return dados.some(b => {
        if (b.tipo === "sumario") return true;
        return b.conteudo && b.conteudo.replace(/\s/g, "") !== "";
    });
}

function irParaPagina(p) {

    if (p < 1) return;

    paginaAtual = p;

    localStorage.setItem("paginaAtual", paginaAtual);

    carregarPagina();
    renderPaginas();
}

const btnPrev = document.getElementById("btn-prev");
if (btnPrev) {
    btnPrev.onclick = () => {
        irParaPagina(paginaAtual - 1);
    };
}

const btnNext = document.getElementById("btn-next");
if (btnNext) {
    btnNext.onclick = () => {
        irParaPagina(paginaAtual + 1);
    };
}

function criarFolhaMiniatura(dados) {

    const folhaMini = document.createElement("div");
    folhaMini.className = "folha pautado";

    folhaMini.style.width = "1100px";
    folhaMini.style.height = "1855px";
    folhaMini.style.position = "relative";
    folhaMini.style.overflow = "hidden";

    dados.forEach(el => {
        const bloco = document.createElement("div");
        
        bloco.className = "bloco " + el.tipo;
        
        bloco.style.position = "absolute";
        bloco.style.top = el.y + "px";
        bloco.style.left = (el.x <= 1 ? el.x * 1100 : el.x) + "px";
        bloco.style.width = (el.width <= 1 ? el.width * 1100 : el.width) + "px";
        
        bloco.innerHTML = el.conteudo;
        bloco.contentEditable = false;
        
        // 🔵 SE FOR SUMÁRIO → overlay com "Lição X"
        if (el.tipo === "sumario") {
        
            const overlay = document.createElement("div");
        
            overlay.className = "thumb-sumario-label";
        
            const match = el.conteudo.match(/Lição n.º (\d+)/);
            const licao = match ? match[1] : "?";
        
            overlay.innerText = "Lição " + licao;
        
            bloco.appendChild(overlay);
        }
        
        folhaMini.appendChild(bloco);
    });

    return folhaMini;
}

function folhaParaMiniatura({ x, y, width, height }, thumb) {

    const ALTURA_FOLHA = 1855;
    const LARGURA_FOLHA = 1100;

    const MARGEM_ESQ = 95;
    const MARGEM_DIR = 62;

    const alturaThumb = 180;
    const escala = alturaThumb / ALTURA_FOLHA;

    const larguraThumb = thumb.clientWidth || 120;

    const areaUtil = LARGURA_FOLHA - MARGEM_ESQ - MARGEM_DIR;

    // 🔥 converter X e WIDTH para reais
    const xReal = x <= 1 ? x * LARGURA_FOLHA : x;
    const wReal = width <= 1 ? width * LARGURA_FOLHA : width;

    // 🔥 normalizar dentro da área útil
    const xNorm = (xReal - MARGEM_ESQ) / areaUtil;
    const wNorm = wReal / areaUtil;

    return {
        x: xNorm * larguraThumb,
        y: y * escala,
        width: wNorm * larguraThumb,
        height: height ? height * escala : null,
        escala
    };
}

function contarLinhasSumario(html) {

    const temp = document.createElement("div");
    temp.innerHTML = html;

    const linhas = temp.querySelectorAll(".sumario-linha");

    if (linhas.length) return linhas.length;

    return 3; // fallback seguro
}

function bloquearViewport() {
    const viewport = document.getElementById("viewport");
    if (!viewport) return;

    viewport.classList.add("locked");
}

function desbloquearViewport() {
    const viewport = document.getElementById("viewport");
    if (!viewport) return;

    viewport.classList.remove("locked");
}

function scrollParaSumario(y) {

    const bloco = document.querySelector(`[data-sumario-id="${y}"]`);
    if (!bloco) return;

    bloco.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function formatarData(dataISO) {

    if (!dataISO) return "";

    const [ano, mes, dia] = dataISO.split("-");

    return dia + "-" + mes + "-" + ano;
}

function getCaminhoPaginaNumero(pagina) {
    return "data/cadernos/" + window.anoLetivo + "/" + window.userID + "/pagina_" + pagina + ".json";
}

function criarMiniatura(pagina, container) {

    const thumb = document.createElement("div");
    thumb.className = "pagina-thumb";
    
    // 🔥 CACHE
    if (thumbCache[pagina]) {
        thumb.appendChild(thumbCache[pagina].cloneNode(true));
    }

    let sumarios = [];

    if (pagina === paginaAtual) {
        thumb.classList.add("ativa");
    }

    thumb.onclick = () => {
        paginaAtual = pagina;

        localStorage.setItem("paginaAtual", paginaAtual);
        renderPaginas();
        carregarPagina();
        fecharMenu();
    };

    container.appendChild(thumb);

    fetch(getCaminhoPaginaNumero(pagina) + "?t=" + Date.now())
        .then(res => res.ok ? res.json() : [])
        .then(dados => {
        
            if (!Array.isArray(dados)) return;
        
            const folhaMini = criarFolhaMiniatura(dados);
            
            // 🔥 POSICIONAMENTO (EXTRA)
            folhaMini.style.position = "absolute";
            folhaMini.style.top = "0";
            folhaMini.style.left = "0";
            
            // 🔥 escala automática
            const escala = 180 / 1855;
            
            folhaMini.style.transform = `scale(${escala})`;
            folhaMini.style.transformOrigin = "top left";
            
            folhaMini.style.pointerEvents = "none";
            
            thumb.appendChild(folhaMini);

            // 🔥 CACHE
            thumbCache[pagina] = folhaMini.cloneNode(true);
        })

        .catch(() => {});
        
        return thumb;
}

function abrirFormularioSumario() {

    const overlay = document.createElement("div");
    overlay.className = "form-overlay";
    document.body.appendChild(overlay);
    bloquearViewport();

    const form = document.createElement("div");
    form.className = "form-sumario";

    form.innerHTML = `
        <label>Lição n.º</label>
        <input type="number" id="sum-licao" required>
    
        <label>Data</label>
        <input type="date" id="sum-data" required>
    
        <label>Sumário</label>
        <textarea id="sum-texto" required></textarea>
    
        <div class="botoes">
            <button id="sum-ok">OK</button>
            <button id="sum-cancel">Cancelar</button>
        </div>
    `;

    document.body.appendChild(form);

    form.querySelector("#sum-data").valueAsDate = new Date();

    form.querySelector("#sum-ok").onclick = () => {
    
        const licao = form.querySelector("#sum-licao").value.trim();
        const data = form.querySelector("#sum-data").value.trim();
        const texto = form.querySelector("#sum-texto").value.trim();
    
        if (!licao || !data || !texto) {
            alert("Preenche todos os campos do sumário.");
            return;
        }
    
        const pos = window.posicaoSumario;
    
        criarBlocoSumario(pos.x, pos.y, licao, data, texto);
        
        desbloquearViewport();

        const overlay = document.querySelector(".form-overlay");
        if (overlay) overlay.remove();
    
        form.remove();
    };

    form.querySelector("#sum-cancel").onclick = () => {
        
        desbloquearViewport();

        window.posicaoSumario = null;
    
        form.remove();
        overlay.remove();
    };
}

window.abrirFormularioSumario = abrirFormularioSumario;

// 🔥 RESTAURAR LOGO AO CARREGAR
/*********const savedPagina = parseInt(localStorage.getItem("paginaAtual"));
if (savedPagina && savedPagina > 0) {
    paginaAtual = savedPagina;
}*******/

function renderPaginas() {

    const container = document.getElementById("lista-paginas");
    if (!container) return;
    
    // 🔥 limpar cache SEMPRE
    for (let k in thumbCache) {
        delete thumbCache[k];
    }

    fetch("list_pages.php")
    .then(res => res.json())
    .then(paginas => {

        paginasCache = paginas;
        
        container.innerHTML = "";
        
        paginas.sort((a, b) => a - b);

        Promise.all(
            paginas.map(p =>
                fetch(getCaminhoPaginaNumero(p))
                .then(res => res.ok ? res.json() : [])
                .then(dados => ({ p, dados }))
            )
        ).then(lista => {
        
            lista.forEach(({ p, dados }, index) => {
        
                const thumb = criarMiniatura(p, container);
        
                const temConteudo = paginaTemConteudo(dados);
                const isUltima = index === lista.length - 1;
        
                // 🔥 botão X (SÓ SE VAZIA E NÃO ÚLTIMA)
                if (!temConteudo && !isUltima) {
        
                    const del = document.createElement("div");
                    del.className = "thumb-delete";
                    del.innerText = "×";
        
                    del.onclick = (e) => {
                        e.stopPropagation();
                        apagarPagina(p);
                    };
        
                    thumb.appendChild(del);
                }
        
                // 🔥 botão +
                if (!isUltima) {
        
                    const add = document.createElement("div");
                    add.className = "thumb-add";
                    add.innerText = "+";
                    
                    add.onclick = (e) => {
                        e.stopPropagation();
                        inserirPagina(p);
                    };
                    
                    thumb.appendChild(add);
                }
        
            });
        
        });
        
        atualizarBotoesNavegacao();

    })
    .catch(() => {
        container.innerHTML = "";
    });
}

function getPointerPosition(e) {

    const rect = folha.getBoundingClientRect();

    let clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let clientY = e.touches ? e.touches[0].clientY : e.clientY;

    let x = clientX - rect.left;
    const offsetPautado = 22; // 🔥 diferença real (116 - 90)
    let y = clientY - rect.top - offsetPautado;

    return {
        x: Math.round(x),
        y: Math.round(y)
    };
}

function criarBlocoComRegras(x, y) {

    const paddingLeft = 95;
    const paddingTop = 90;
    const paddingRight = 62;
    const paddingBottom = 40;

    const linha = 35;

    const limiteEsquerdo = paddingLeft;
    const limiteDireito = 1100 - paddingRight - 50;

    const limiteTopo = paddingTop;
    const limiteFundo = 1855 - paddingBottom - linha;

    // X
    x = Math.max(limiteEsquerdo, x);
    x = Math.min(limiteDireito, x);

    // Y limites
    y = Math.max(limiteTopo, y);
    y = Math.min(limiteFundo, y);

    // 🔥 SNAP
    // posição relativa à grelha
    const yRel = y - paddingTop;
    
    // 🔥 linha inteira (sem influência de pixels intermédios)
    const linhaIndex = Math.floor((yRel + linha / 2) / linha);
    
    // posição final EXATA da linha
    y = paddingTop + linhaIndex * linha;    
    
    const larguraFolha = 1100;
    const margemDireita = 62;
    
    let largura = larguraFolha - x - margemDireita;
    if (largura < 50) largura = 50;
    
    const altura = 35;
    
    // 🔥 AGORA sim — posição final validada
    if (existeColisao(x, y, largura, altura)) {
        return;
    }
    
    criarBlocoTexto(x, y);
}

document.addEventListener("DOMContentLoaded", () => {
    init();
});

function init() {

    const saved = parseInt(localStorage.getItem("paginaAtual"));

    initMenu();
    
    fetch("list_pages.php")
    .then(res => res.json())
    .then(paginas => {

        paginas.sort((a, b) => a - b);

        //ESTE BLOCO ATÉ localStorage... garante que se comece sempre em "pagina_1,json"
		if (!paginas.length) {
            paginaAtual = 1;
        } else {

            const primeira = paginas[0];
            const ultima = paginas[paginas.length - 1];

            // 🔥 validar localStorage
            if (saved && paginas.includes(saved)) {
                paginaAtual = saved;
            } else {
                paginaAtual = ultima; // 🔥 fallback correto
            }
        }

        localStorage.setItem("paginaAtual", paginaAtual);

        renderPaginas();
        carregarPagina();
    });
}


function obterAlturaLayout() {

    const folha = document.querySelector('.folha');
    const header = document.querySelector('#header-wrapper');

    const alturaFolha = folha.offsetHeight;
    const alturaHeader = header ? header.offsetHeight : 0;

    return alturaFolha + alturaHeader + 40; // margem extra
}

function corrigirCoordenadas(x, y) {

    const escala = window.escala || 1;

    return {
        x: x / escala,
        y: y / escala
    };
}

function initMenu() {

    const menuBtn = document.getElementById("menu-btn");
    const menu = document.getElementById("menu");
    const overlay = document.getElementById("menu-overlay");
    const closeBtn = document.getElementById("menu-close");
    const btnSumario = document.getElementById("btn-sumario");
    const btnPreview = document.getElementById("btn-preview");
    const btnSumarios = document.getElementById("btn-sumarios");
    
    const listaPaginas = document.getElementById("lista-paginas");
    const listaSumarios = document.getElementById("lista-sumarios");
    
    if (btnPreview && btnSumarios) {
    
        btnPreview.onclick = () => {
        
            btnPreview.classList.add("ativo");
            btnSumarios.classList.remove("ativo");
    
            // 🔥 limpar estilos antigos
            listaPaginas.style.display = "";
            listaSumarios.style.display = "";
    
            listaPaginas.classList.remove("hidden");
            listaSumarios.classList.add("hidden");
        };
    
        btnSumarios.onclick = () => {
        
            btnSumarios.classList.add("ativo");
            btnPreview.classList.remove("ativo");
    
            // 🔥 limpar estilos antigos
            listaPaginas.style.display = "";
            listaSumarios.style.display = "";
    
            listaPaginas.classList.add("hidden");
            listaSumarios.classList.remove("hidden");
    
            renderIndiceSumarios();
        };
    }

    function renderIndiceSumarios() {

        const container = document.getElementById("lista-sumarios");
    
        // 🔥 novo token
        const token = ++renderSumariosToken;
    
        container.innerHTML = "";

        fetch("list_pages.php")
        .then(res => res.json())
        .then(paginas => {
    
            paginas.sort((a, b) => a - b);
    
            paginas.forEach(i => {
    
                fetch(getCaminhoPaginaNumero(i) + "?t=" + Date.now())
                .then(res => res.ok ? res.json() : [])
                .then(dados => {
                    
                    if (token !== renderSumariosToken) return;
    
                    if (!Array.isArray(dados)) return;
    
                    const sumarios = dados.filter(b => b.tipo === "sumario");
                    if (!sumarios.length) return;
    
                    sumarios.sort((a, b) => a.y - b.y);
    
                    sumarios.forEach(sumario => {
    
                        const item = document.createElement("div");
                        item.className = "item-sumario";
    
                        const licao = (sumario.conteudo.match(/Lição n.º (\d+)/) || [])[1] || "?";
                        const data = (sumario.conteudo.match(/(\d{2}-\d{2}-\d{4})/) || [])[1] || "";
    
                        item.innerHTML = `
                            <strong>Lição ${licao}</strong><br>
                            <span>${data}</span>
                        `;
    
                        item.onclick = () => {
    
                            paginaAtual = i;

                            carregarPagina();
                            renderPaginas();
    
                            setTimeout(() => {
                                scrollParaSumario(sumario.y);
                            }, 200);
    
                            if (window.fecharMenu) fecharMenu();
                        };
    
                        container.appendChild(item);
                    });
    
                });
    
            });
    
        });
    }

    if (!menuBtn || !menu || !overlay || !closeBtn) return;

    function fecharMenuLocal() {
        menu.classList.remove("open");
        overlay.classList.remove("open");
    }

    menuBtn.onclick = () => {
        menu.classList.add("open");
        overlay.classList.add("open");
    };

    closeBtn.onclick = fecharMenuLocal;
    overlay.onclick = fecharMenuLocal;

    // 🔥 BOTÃO SUMÁRIO (NOVO)
    if (btnSumario) {
        btnSumario.onclick = () => {
            window.modoSumario = true;
    
            fecharMenuLocal();
    
            document.body.classList.add("modo-sumario");
    
            // 🔥 MOSTRAR INDICADOR
            const indicador = document.createElement("div");
            indicador.className = "indicador-sumario";
            indicador.id = "indicador-sumario";
    
            indicador.innerText = "Clique na linha para o sumário";
    
            document.body.appendChild(indicador);
        };
    }

    // 🔥 tornar global (para usar nas miniaturas)
    window.fecharMenu = fecharMenuLocal;
}

// ===============================
// 📚 CADERNOS
// ===============================

function criarCaderno() {
    fetch("api/criar_caderno.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            titulo: "Novo caderno"
        })
    })
    .then(r => r.text())
    .then(res => {
        console.log("Resposta:", res);
        carregarCadernos();
    })
    .catch(err => console.error(err));
}

function carregarCadernos() {
    const container = document.getElementById("lista-cadernos");
    if (!container) return;

    fetch("api/listar_cadernos.php")
        .then(r => r.json())
        .then(cadernos => {

            container.innerHTML = "";

            cadernos.forEach(c => {

                const div = document.createElement("div");
                div.className = "caderno-item";

                div.innerHTML = `
                    <strong>${c.titulo}</strong><br>
                    ${c.disciplina || ""}
                `;

                container.appendChild(div);
            });
        });
}