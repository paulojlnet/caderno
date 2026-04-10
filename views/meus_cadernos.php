<div style="padding:20px">

    <h2>Os meus cadernos</h2>

    <button onclick="criarCaderno()">+ Criar caderno</button>

    <div id="lista-cadernos" style="margin-top:20px;"></div>

</div>

<script>
document.addEventListener("DOMContentLoaded", () => {
    if (typeof carregarCadernos === "function") {
        carregarCadernos();
    }
});
</script>