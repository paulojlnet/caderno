const thumbCache = {};
let paginaAtual = 1;
let paginasCache = [];
window.modoSumario = false;
window.posicaoSumario = null;
let viewportScrollLeft = 0;
let renderSumariosToken = 0;
let mudouPagina = false;
let pageIndicatorTimeout;
const urlParams = new URLSearchParams(window.location.search);
window.cadernoID = urlParams.get("caderno");
window.formCadernoAberto = false;

function getCorFundo(cor) {

    const cores = {
        blue: "rgba(46,149,170,0.35)",
        green: "rgba(171,195,181,0.7)",
        red: "rgba(204,75,72,0.45)",
        teal: "rgba(0,102,102,0.35)",
        violet: "rgba(238,130,238,0.25)",
        orange: "rgba(255,193,132,0.5)"
    };

    return cores[cor] || "#F0EEC6";
}

function getCorTexto(cor) {

    const coresEscuras = ["blue", "teal", "red", "darkred", "black", "mdnightblue"];

    return coresEscuras.includes(cor) ? "#fff" : "#000";
}

function aplicarFundoCaderno(cadernos) {

    const app = document.querySelector(".app");

    // 🔥 se não estiver num caderno → fundo default
    if (!window.cadernoID) {
        if (app) app.style.background = "#F0EEC6";
        return;
    }

    const caderno = cadernos.find(c => c.id === window.cadernoID);

    if (!caderno) return;

    const cor = caderno.cor || "blue";

    const cores = {
        blue: "rgba(46,149,170,0.35)",
        green: "rgba(171,195,181,0.7)",
        red: "rgba(204,75,72,0.45)",
        teal: "rgba(0,102,102,0.35)",
        violet: "rgba(238,130,238,0.25)",
        orange: "rgba(255,193,132,0.5)"
    };

    if (app) {
        app.style.background = cores[cor] || "#F0EEC6";
    }
}

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

    fetch("list_pages.php?caderno=" + cadernoID)
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

                        return fetch("save.php?caderno=" + cadernoID + "&pagina=" + (p + 1), {
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
            fetch("save.php?caderno=" + cadernoID + "&pagina=" + (paginaBase + 1), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify([])
            })
            .then(() => {

                renderPaginas();

                // 🔥 ir para a nova página
                paginaAtual = paginaBase + 1;
				if (window.cadernoID && typeof carregarPagina === "function") {
					carregarPagina();
				}
            });

        });

    });
}

function apagarPagina(paginaRemover) {

    fetch("list_pages.php?caderno=" + cadernoID)
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

                            fetch("save.php?caderno=" + cadernoID + "&pagina=" + (p - 1), {
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
                fetch("delete.php?caderno=" + cadernoID + "&pagina=" + ultima)
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
					if (window.cadernoID && typeof carregarPagina === "function") {
						carregarPagina();
					}
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

	if (window.cadernoID && typeof carregarPagina === "function") {
		carregarPagina();
	}
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
    return "save.php?caderno=" + cadernoID + "&pagina=" + pagina;
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
		if (window.cadernoID && typeof carregarPagina === "function") {
			carregarPagina();
		}
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

function abrirFormularioCaderno(dados = null) {
	
	const menu = document.getElementById("menu");
	const overlay = document.getElementById("menu-overlay");

	menu?.classList.remove("open");
	overlay?.classList.remove("open");

    const form = document.createElement("div");
    form.className = "form-sumario";

	form.innerHTML = `
		<div class="form-caderno">

			<div class="form-col-esq">

				<label>Título</label>
				<input type="text" id="cad-titulo" placeholder="Novo caderno" maxlength="50" autocomplete="off">
				<div class="cad-titulo-info">(máx. 50 caracteres)</div>

				<label>Disciplina</label>
				<select id="cad-disciplina"></select>

				<label>Ano</label>
				<select id="cad-ano"></select>

				<label>Turmas</label>
				<div id="cad-turmas"></div>

				<label>Cor</label>
				<div id="cad-cor" class="color-palette"></div>

			</div>

			<div class="form-col-dir">
				<label>Preview</label>
				<div id="cad-preview"></div>
			</div>

		</div>

		<div class="botoes">
			<button id="cad-ok" type="button">Criar</button>
			<button id="cad-cancel" type="button">Cancelar</button>
		</div>
	`;

    document.body.appendChild(form);
	
	window.cadernoEditando = dados?.id || null;
	
	window.formCadernoAberto = true;
	
	window.corSelecionada = "blue";	

	preencherAnos();
	preencherTurmas();
	preencherCores();
	preencherDisciplinas();

	if (dados) {

		document.getElementById("cad-titulo").value = dados.titulo || "";

		window.corSelecionada = dados.cor || "blue";

		form.querySelector("#cad-ok").textContent = "Guardar";

		setTimeout(() => {

			document.getElementById("cad-disciplina").value = (dados.disciplina || "").toUpperCase();
			document.getElementById("cad-ano").value = dados.ano || "";

			document.querySelectorAll("#cad-cor span").forEach(el => {
				el.style.outline = (el.dataset.cor === window.corSelecionada)
					? "2px solid black"
					: "none";
			});

			atualizarPreview(); // 🔥 agora já com disciplina correta

		}, 100);
	}	
	
	if (dados?.turmas) {
		setTimeout(() => {
			document.querySelectorAll("#cad-turmas input").forEach(el => {
				if (dados.turmas.includes(el.value)) {
					el.checked = true;
				}
			});
		}, 50);
	}

    // eventos
    form.querySelector("#cad-cancel").onclick = () => {
		form.remove();
		window.formCadernoAberto = false;
	};

	form.querySelector("#cad-ok").onclick = () => {

		const ok = criarCadernoComDados();

		if (ok) {
			form.remove();
			window.formCadernoAberto = false;
		}
	};

	form.querySelectorAll("input").forEach(el => {
		el.addEventListener("input", atualizarPreview);
	});

	form.querySelectorAll("select").forEach(el => {
		el.addEventListener("change", atualizarPreview);
	});
}

function preencherDisciplinas() {
    fetch("data/disciplinas.json")
        .then(r => r.json())
        .then(lista => {

            const select = document.getElementById("cad-disciplina");
            if (!select) return;

            select.innerHTML = ""; // limpar

			const optDefault = document.createElement("option");
			optDefault.value = "";
			optDefault.textContent = "Selecionar";
			optDefault.selected = true;
			optDefault.disabled = true;

			select.appendChild(optDefault);

            lista.forEach(d => {
                const opt = document.createElement("option");
                opt.value = d.abbr;
                opt.textContent = d.nome;
                select.appendChild(opt);
            });
        })
        .catch(err => console.error("Erro disciplinas:", err));
}

function preencherAnos() {
    fetch("api/get_dados_estrutura.php")
        .then(r => r.json())
        .then(d => {
            const select = document.getElementById("cad-ano");
			
			const optDefault = document.createElement("option");
			optDefault.value = "";
			optDefault.textContent = "Selecionar";
			optDefault.selected = true;
			optDefault.disabled = true;

			select.appendChild(optDefault);			
			
            d.anos.forEach(a => {
                const opt = document.createElement("option");
                opt.value = a;
                opt.textContent = a;
                select.appendChild(opt);
            });
        });
}

function preencherTurmas() {
    fetch("api/get_dados_estrutura.php")
        .then(r => r.json())
        .then(d => {
            const container = document.getElementById("cad-turmas");

            d.turmas.forEach(t => {
                const label = document.createElement("label");
				label.innerHTML = `
					${t} <input type="checkbox" value="${t}">
				`;
                container.appendChild(label);
            });
        });
}

function preencherCores() {

    const container = document.getElementById("cad-cor");
    if (!container) return;

    container.innerHTML = "";

    const coresCaderno = {
        blue: "#2e95aa",
        green: "#abc3b5",
        red: "#cc4b48",
        teal: "#006666",
        violet: "#ee82ee",
        orange: "#ff8f66"
    };

    for (let nome in coresCaderno) {
		
        const el = document.createElement("span");

        el.style.background = coresCaderno[nome];
        el.dataset.cor = nome;

        el.onclick = () => {

            window.corSelecionada = nome;

            // remover seleção anterior
            document.querySelectorAll("#cad-cor span").forEach(s => {
                s.style.outline = "none";
            });

            // destacar selecionado
            el.style.outline = "2px solid black";

            atualizarPreview();
        };
		
		if (nome === "blue") {
			el.style.outline = "2px solid black";
		}

        container.appendChild(el);
    }
}

function atualizarPreview() {

    const titulo = document.getElementById("cad-titulo")?.value || "Novo caderno";
    const cor = window.corSelecionada || "blue";
    const disciplina = (document.getElementById("cad-disciplina")?.value || "").toUpperCase();

    const preview = document.getElementById("cad-preview");
    const corTexto = getCorTexto(cor);

    preview.innerHTML = `
        <div class="moleskine-wrapper">
            <div class="moleskine-notebook">
                <div class="notebook-cover ${cor}">
                    <div class="notebook-disciplina" style="color:${corTexto}">
                        ${disciplina}
                    </div>				
                    <div class="notebook-skin">${titulo}</div>
                </div>
                <div class="notebook-page ruled"></div>
            </div>
        </div>
    `;
}

function criarCadernoComDados() {

    const titulo = document.getElementById("cad-titulo").value.trim();
    const disciplina = document.getElementById("cad-disciplina").value;
    const ano = document.getElementById("cad-ano").value;

    const turmas = [...document.querySelectorAll("#cad-turmas input:checked")]
        .map(el => el.value);

    if (!titulo) {
        alert("Indique o título");
        return false;
    }

    if (!disciplina) {
        alert("Selecione a disciplina");
        return false;
    }

    if (!ano) {
        alert("Selecione o ano");
        return false;
    }

    if (turmas.length === 0) {
        alert("Selecione pelo menos uma turma");
        return false;
    }

const url = window.cadernoEditando
    ? "api/editar_caderno.php"
    : "api/criar_caderno.php";

	const payload = {
		titulo,
		disciplina,
		ano,
		turmas,
		cor: window.corSelecionada || "blue"
	};

	// 🔥 se for edição, enviar id
	if (window.cadernoEditando) {
		payload.id = window.cadernoEditando;
	}

	fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(payload)
	})
	.then(() => {
		window.cadernoEditando = null;
		carregarCadernos();
	});

    return true;
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

    fetch("list_pages.php?caderno=" + cadernoID)
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
	
    document.getElementById("btn-fechar-caderno")?.addEventListener("click", () => {
        window.location.href = "index.php";
    });
});

function init() {

    const saved = parseInt(localStorage.getItem("paginaAtual"));

    initMenu();
	
    // 🔥 AQUI — aplicar cor do caderno
    fetch("api/listar_cadernos.php")
    .then(r => r.json())
    .then(cadernos => {
        aplicarFundoCaderno(cadernos);
    });
    
    fetch("list_pages.php?caderno=" + cadernoID)
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
		if (window.cadernoID && typeof carregarPagina === "function") {
			carregarPagina();
		}
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

        fetch("list_pages.php?caderno=" + cadernoID)
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

							if (window.cadernoID && typeof carregarPagina === "function") {
								carregarPagina();
							}
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

		if (window.formCadernoAberto) return;

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
	const containerGrid = document.getElementById("lista-cadernos");
	const containerMenu = document.getElementById("lista-cadernos-menu");

	if (!containerGrid && !containerMenu) return;

    fetch("api/listar_cadernos.php")
    .then(r => r.json())
    .then(cadernos => {
		
		aplicarFundoCaderno(cadernos);

		if (containerGrid) containerGrid.innerHTML = "";
		if (containerMenu) containerMenu.innerHTML = "";

		cadernos.forEach(c => {

			// 🔵 MENU (lista simples)
			if (containerMenu) {
				const divMenu = document.createElement("div");
				divMenu.className = "caderno-menu-item";
				
				const corTexto = getCorTexto(c.cor || "blue");

				divMenu.innerHTML = `
					<div class="caderno-mini notebook-cover ${c.cor || "blue"}"></div>

					<div class="caderno-info">
						<div><strong>${c.titulo}</strong></div>
						<div>Disciplina: ${(c.disciplina || "").toUpperCase()}</div>
						<div class="notebook-disciplina" style="color:${corTexto}">
							${(c.disciplina || "").toUpperCase()}
						</div>						
					</div>

					<div class="caderno-acoes">
						<button class="btn-editar">✎</button>
						<button class="btn-delete">✕</button>
					</div>
				`;

				// 🔥 abrir caderno
				divMenu.querySelector(".caderno-info").onclick = () => {
					window.location.href = "index.php?caderno=" + c.id;
				};

				divMenu.querySelector(".btn-delete").onclick = async (e) => {
					e.stopPropagation();

					// 🔥 verificar páginas (frontend)
					const res = await fetch("list_pages.php?caderno=" + c.id);
					const paginas = await res.json();

					let temConteudo = false;

					for (let p of paginas) {

						const r = await fetch(`get_page.php?caderno=${c.id}&pagina=${p}`);
						const dados = await r.json();

						if (dados && dados.length > 0) {
							temConteudo = true;
							break;
						}
					}

					if (temConteudo) {
						alert("Este caderno contém páginas com conteúdo e não pode ser apagado.");
						return;
					}

					if (!confirm("Apagar este caderno?")) return;

					// 🔥 delete com validação backend
					const resp = await fetch("api/apagar_caderno.php?id=" + c.id);
					const texto = await resp.text();

					let resFinal;

					try {
						resFinal = JSON.parse(texto);
					} catch {
						resFinal = texto;
					}

					if (resFinal?.erro === "tem_conteudo") {
						alert("Este caderno tem conteúdo e não pode ser apagado.");
						return;
					}

					carregarCadernos();
				};
				
				// 🔥 editar
				divMenu.querySelector(".btn-editar").onclick = (e) => {
					e.stopPropagation();
					abrirFormularioCaderno(c);
				};

				containerMenu.appendChild(divMenu);
			}

			// 🔵 PÁGINA PRINCIPAL (miniaturas)
			if (containerGrid) {
				const divGrid = document.createElement("div");
				const corTexto = getCorTexto(c.cor || "blue");

				divGrid.innerHTML = `
					<div class="moleskine-wrapper">
						<div class="moleskine-notebook">
							<div class="notebook-cover ${c.cor || "blue"}">
							<div class="notebook-disciplina" style="color:${corTexto}">
								${(c.disciplina || "").toUpperCase()}
							</div>							
								<div class="notebook-skin">${c.titulo}</div>
								<div class="notebook-fundo">${window.anoLetivo || ""}</div>
							</div>
							<div class="notebook-page ruled"></div>
						</div>
					</div>
				`;

				divGrid.querySelector(".moleskine-wrapper").onclick = () => {
					window.location.href = "index.php?caderno=" + c.id;
				};

				containerGrid.appendChild(divGrid);
			}

		});
	});
}