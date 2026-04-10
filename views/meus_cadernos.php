<div style="padding:20px">

    <h2>Os meus cadernos</h2>

    <button onclick="criarCaderno()">+ Criar caderno</button>

    <div id="lista-cadernos" style="margin-top:20px;"></div>

</div>

<script src="/assets/js/app.js"></script>

<script>
document.addEventListener("DOMContentLoaded", () => {
    carregarCadernos();
});
</script>