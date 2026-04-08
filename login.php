<?php
session_start();

// já logado → ir para app
if (isset($_SESSION['user'])) {
    header("Location: index.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="pt">
<head>
    <meta charset="UTF-8">
    <title>Login</title>

    <style>
        body {
            font-family: Arial;
            background: #f5f5f5;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }

        .login-box {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            width: 300px;
        }

        input {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
        }

        button {
            width: 100%;
            padding: 10px;
            background: #1e3a8a;
            color: white;
            border: none;
            cursor: pointer;
        }
    </style>
</head>
<body>

<div class="login-box">

    <h2>Login</h2>
    
    <?php if (!empty($_GET['erro'])): ?>
        <div id="login-error" style="color:#b00020; margin-bottom:10px;">
            Utilizador ou senha inválidos
        </div>
    <?php endif; ?>
    
    <form method="POST" action="login_process.php">
        <input id="username" name="username" placeholder="Utilizador" required>
        <input id="password" name="password" type="password" placeholder="Senha" required>
        <button>Entrar</button>
    </form>

</div>

<script>
window.addEventListener("DOMContentLoaded", () => {

    const erro = document.getElementById("login-error");

    if (erro) {
        const password = document.getElementById("password");

        if (password) {
            password.value = "";   // 🔥 limpa senha
            password.focus();      // 🔥 foco automático
        }
    }

});

if (erro) {
    // 🔥 limpar URL (remove ?erro=1)
    window.history.replaceState({}, document.title, window.location.pathname);
}
</script>

</body>
</html>