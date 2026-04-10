<?php
session_start();
// 🔥 limpar sessão antiga
session_unset();
session_destroy();
session_start();

$file = __DIR__ . "/data/users/users.json";

$data = json_decode(file_get_contents($file), true);

$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

foreach ($data['users'] as $user) {

    if ($user['username'] === $username &&
        password_verify($password, $user['password'])) {

        $_SESSION['user'] = $user;
        $_SESSION['userId'] = $user['id'];
		$_SESSION['grupo'] = $user['grupo'];

        // 🔥 redirecionamento simples (para já)
        switch ($user['grupo']) {

        case 'admin':
            header("Location: admin/index.php");
            break;
    
        case 'professor':
            header("Location: index.php");
            break;
    
        case 'aluno':
            header("Location: index.php");
            break;
    
        default:
            header("Location: index.php");
    }
    
    exit;
    }
}

// erro
header("Location: login.php?erro=1");
exit;