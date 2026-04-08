let usersData = [];
let currentSort = { field: "id", asc: true };
let currentEditId = null;

document.querySelectorAll("#admin-menu button").forEach(btn => {

    btn.onclick = () => {

        const view = btn.dataset.view;

        document.querySelectorAll(".admin-view").forEach(v => {
            v.classList.add("hidden");
        });

        document.getElementById("view-" + view).classList.remove("hidden");
    };

});

document.addEventListener("DOMContentLoaded", () => {

    // 🔥 ELEMENTOS
    const menuBtn = document.getElementById("menu-btn");
    const menu = document.getElementById("menu");
    const overlay = document.getElementById("menu-overlay");

    // 🔥 ABRIR MENU
    if (menuBtn && menu && overlay) {
        menuBtn.onclick = () => {
            menu.classList.add("open");
            overlay.classList.add("open");
        };

        // 🔥 FECHAR MENU (overlay)
        overlay.onclick = () => {
            menu.classList.remove("open");
            overlay.classList.remove("open");
        };
    }

    // 🔥 TROCAR VIEWS
    const items = document.querySelectorAll("#admin-nav .menu-item");

    items.forEach(item => {

        item.onclick = () => {

            const view = item.dataset.view;

            // esconder todas
            document.querySelectorAll(".admin-view").forEach(v => {
                v.classList.add("hidden");
            });

            // mostrar selecionada
            const target = document.getElementById("view-" + view);
            if (target) target.classList.remove("hidden");

            // fechar menu
            if (menu && overlay) {
                menu.classList.remove("open");
                overlay.classList.remove("open");
            }

        };

    });
    
    loadUsers();

});

function scrollToUser(id) {

    const row = document.querySelector(`tr[data-id='${id}']`);

    if (!row) return;

    row.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    // 🔥 highlight temporário (bónus UX)
    row.style.background = "#fff3cd";

    setTimeout(() => {
        row.style.background = "";
    }, 1500);
}

function togglePassword() {
    const input = document.getElementById("f-password");
    input.type = input.type === "password" ? "text" : "password";
}

function deleteUser(id) {

    if (!confirm("Apagar utilizador?")) return;

    fetch("delete_user.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "id=" + id
    })
    .then(() => {
        showToast("Utilizador apagado", "success");
        loadUsers();
    });
}

function editUser(id) {

    const u = usersData.find(x => x.id == id);

    currentEditId = u.id;

    openUserModal({
        mode: "edit",
        data: { ...u } // 🔥 clone seguro
    });
}

function labelInput(label, input) {
    return `
        <div>
            <label>${label}</label>
            ${input}
        </div>
    `;
}



function addUser() {

    openUserModal({
        mode: "new",
        data: {
            id: "",
            username: "",
            nome: "",
            apelido: "",
            ano: "",
            turma: "",
            numero: "",
            grupo: "aluno"
        }
    });
}

function openUserModal({ mode, data }) {

    const overlay = document.getElementById("user-modal-overlay");
    const modal = document.getElementById("user-modal");
    const content = document.getElementById("user-modal-content");

    overlay.classList.remove("hidden");
    modal.classList.remove("hidden");

    content.innerHTML = `
        <input type="text" name="fakeuser" autocomplete="username" style="position:absolute; top:-1000px;">
        <input type="password" name="fakepass" autocomplete="current-password" style="position:absolute; top:-1000px;">
        
        <h3>${mode === "edit" ? "Editar Utilizador" : "Novo Utilizador"}</h3>

        <div class="user-form-grid">
        
            ${field("ID", `<input id="f-id" name="fake_id_${Date.now()}" autocomplete="off" value="${data.id}">`)}
        
            ${field("Username", `<input id="f-username" name="user_${Date.now()}" autocomplete="off" value="${mode==='new'?'':(data.username||'')}">`)}
            
            ${field("Password", `
                <div style="display:flex; gap:4px;">
                    <input id="f-password" type="password" autocomplete="new-password" name="pass_${Date.now()}" style="flex:1;">
                    <button type="button" onclick="togglePassword()">👁</button>
                </div>
            `)}
        
            ${field("Nome", `<input id="f-nome" autocomplete="off" value="${data.nome || ''}">`)}
        
            ${field("Apelido", `<input id="f-apelido" autocomplete="off" value="${data.apelido || ''}">`)}
        
            <div class="row-2">
        
                ${field("Ano", `<input id="f-ano" autocomplete="off" value="${data.ano || ''}">`)}
        
                ${field("Turma", `<input id="f-turma" autocomplete="off" value="${data.turma || ''}">`)}
        
                ${field("Número", `<input id="f-numero" autocomplete="off" value="${data.numero || ''}">`)}
        
                ${field("Grupo", `
                    <select id="f-grupo">
                        <option ${data.grupo=="aluno"?"selected":""}>aluno</option>
                        <option ${data.grupo=="professor"?"selected":""}>professor</option>
                        <option ${data.grupo=="admin"?"selected":""}>admin</option>
                    </select>
                `)}
        
            </div>
        
        </div>

        <div class="user-form-actions">
            <button type="button" class="btn-save" onclick="submitUser('${mode}')">✔ Guardar</button>
            <button type="button" class="btn-cancel" onclick="closeUserModal()">✖ Cancelar</button>
        </div>
    `;
    
    setTimeout(() => {
        document.getElementById("f-id").value = data.id || "";
        document.getElementById("f-username").value = mode === "new" ? "" : (data.username || "");
    }, 50);
}

function field(label, input) {
    return `
        <div class="field">
            <label>${label}</label>
            ${input}
        </div>
    `;
}

function closeUserModal() {
    document.getElementById("user-modal").classList.add("hidden");
    document.getElementById("user-modal-overlay").classList.add("hidden");
}

function submitUser(mode) {

    const data = {
        id: Number(document.getElementById("f-id").value),
        originalId: currentEditId,
        username: document.getElementById("f-username").value,
        password: document.getElementById("f-password").value,
        nome: document.getElementById("f-nome").value,
        apelido: document.getElementById("f-apelido").value,
        ano: document.getElementById("f-ano").value,
        turma: document.getElementById("f-turma").value,
        numero: document.getElementById("f-numero").value,
        grupo: document.getElementById("f-grupo").value
    };

    // 🔥 validação obrigatórios
    if (!data.id || !data.username || !data.nome || !data.apelido) {
        showToast("Preenche todos os campos obrigatórios", "error");
        return;
    }
    
    // 🔥 password obrigatória (novo utilizador)
    if (mode === "new" && !data.password) {
        showToast("Password é obrigatória", "error");
        return;
    }
    
    // 🔥 validar ID único
    const exists = usersData.some(u =>
        Number(u.id) === data.id && Number(u.id) !== currentEditId
    );
    
    if (exists) {
        showToast("ID já existente", "error");
        return;
    }
    
    const username = data.username.trim().toLowerCase();
    
    const usernameExists = usersData.some(u =>
        u.username.toLowerCase() === username &&
        Number(u.id) !== currentEditId
    );
    
    if (usernameExists) {
        showToast("Username já existe", "error");
        return;
    }
    
    // 🔥 normalizar antes de enviar
    data.username = username;    

    const url = mode === "edit" ? "update_user.php" : "add_user.php";

    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(res => {
    
        if (!res.ok) {
            showToast(res.message || "Erro ao guardar", "error");
            return;
        }
    
        showToast("Guardado com sucesso", "success");
    
        closeUserModal();
        loadUsers(data.id);
    
        setTimeout(() => {
            const row = document.querySelector(`tr[data-id='${data.id}']`);
            if (row) {
                row.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }, 100);
    });
}

function showToast(message, type = "success", duration = 2500) {

    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast " + type;
    toast.innerText = message;

    container.appendChild(toast);

    // 🔥 remover depois de X ms
    setTimeout(() => {
        toast.style.animation = "toast-out 0.2s ease forwards";

        setTimeout(() => {
            toast.remove();
        }, 200);
    }, duration);
}

let previewData = [];

function previewCSV() {

    const fileInput = document.getElementById("csvFile");
    const file = fileInput.files[0];

    if (!file) {
        alert("Seleciona um ficheiro CSV");
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {

        const text = e.target.result;

        const lines = text.split(/\r?\n/);

        previewData = [];

        let total = 0;
        let validos = 0;
        let erros = 0;

        let html = `
            <div class="csv-summary"></div>
            <div class="csv-preview-wrapper">
            <table class="csv-preview-table">
            <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Username</th>
                <th>Grupo</th>
                <th>Estado</th>
            </tr>
        `;

        lines.forEach((line, index) => {

            if (index === 0 || !line.trim()) return;

            total++;

            const cols = line.split(";").map(c => c.trim());

            let erro = false;

            if (cols.length < 9) erro = true;
            if (!cols[6]) erro = true; // username
            if (!cols[8]) erro = true; // grupo

            const user = {
                id: cols[0],
                nome: cols[1],
                apelido: cols[2],
                ano: cols[3],
                turma: cols[4],
                numero: cols[5],
                username: cols[6],
                senha: cols[7],
                grupo: cols[8]
            };

            if (!erro) {
                previewData.push(user);
                validos++;
            } else {
                erros++;
            }

            html += `
                <tr class="${erro ? 'csv-error' : 'csv-ok'}">
                    <td>${user.id}</td>
                    <td>${user.nome} ${user.apelido}</td>
                    <td>${user.username}</td>
                    <td>${user.grupo}</td>
                    <td>${erro ? '❌ Erro' : '✔ OK'}</td>
                </tr>
            `;
        });

        html += "</table></div>";

        html = html.replace(
            '<div class="csv-summary"></div>',
            `<div class="csv-summary">
                Total: <strong>${total}</strong> |
                Válidos: <strong style="color:green">${validos}</strong> |
                Erros: <strong style="color:red">${erros}</strong>
            </div>`
        );

        document.getElementById("preview-area").innerHTML = html;

        document.getElementById("confirmBtn").style.display =
            validos > 0 ? "inline-block" : "none";
    };

    reader.readAsText(file, "UTF-8");
}

function confirmImport() {

    if (!previewData.length) {
        alert("Não existem dados válidos para importar");
        return;
    }

    if (!confirm("Confirmar importação dos utilizadores?")) return;

    const btn = document.getElementById("confirmBtn");
    const status = document.getElementById("upload-status");

    // 🔥 bloquear botão
    btn.disabled = true;
    btn.style.opacity = "0.6";

    // 🔥 mostrar loading
    status.style.display = "block";

    fetch("import_users.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(previewData)
    })
    .then(res => res.json())
    .then(res => {
    
        status.style.display = "none";
        btn.disabled = false;
        btn.style.opacity = "1";
    
        showToast(res.message || "Importação concluída", "success");
    
        setTimeout(() => {
            location.reload();
        }, 1200);
    })
    .catch(() => {
    
        status.style.display = "none";
        btn.disabled = false;
        btn.style.opacity = "1";
    
        showToast("Erro ao guardar", "error");
    });
}

function loadUsers(scrollToId = null) {

    fetch("get_users.php")
    .then(res => res.json())
    .then(data => {

        usersData = data;

        renderUsers();

        // 🔥 scroll após render
        if (scrollToId !== null) {
            scrollToUser(scrollToId);
        }
    });
}

function ordenarUsers(field) {

    if (currentSort.field === field) {
        currentSort.asc = !currentSort.asc;
    } else {
        currentSort.field = field;
        currentSort.asc = true;
    }

    renderUsers();
}

function renderUsers() {

    const container = document.getElementById("users-table");
    if (!container) return;

    let data = [...usersData];

    // 🔥 ordenar
    data.sort((a, b) => {

        let v1 = a[currentSort.field] || "";
        let v2 = b[currentSort.field] || "";

        if (typeof v1 === "number") return currentSort.asc ? v1 - v2 : v2 - v1;

        return currentSort.asc
            ? String(v1).localeCompare(String(v2))
            : String(v2).localeCompare(String(v1));
    });

    let html = `
        <div class="users-table-wrapper">
        <table class="csv-preview-table">
            <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Username</th>
                <th>AT</th>
                <th>Grupo</th>
                <th>Ações</th>
            </tr>
    `;

    data.forEach(u => {

        html += `
            <tr data-id="${u.id}">
                <td>${u.id}</td>
                <td>${u.nome} ${u.apelido}</td>
                <td>${u.username}</td>
                <td>${u.AT || ''}</td>
                <td>${u.grupo}</td>
                    <td>
                        <button onclick="editUser(${u.id})">✏️</button>
                        
                        ${
                            u.id == 0
                            ? '<button disabled title="Admin não pode ser apagado">🗑</button>'
                            : `<button onclick="deleteUser(${u.id})">🗑</button>`
                        }
                    </td>
            </tr>
        `;
    });

    html += "</table></div>";

    container.innerHTML = html;
}