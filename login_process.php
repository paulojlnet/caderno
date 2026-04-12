<?php
session_start();

$file = __DIR__ . "/data/users/users.json";

$data = json_decode(file_get_contents($file), true);

$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

foreach ($data['users'] as $user) {

    if ($user['username'] === $username &&
        password_verify($password, $user['password'])) {

        // 🔥 limpar sessão antiga
        session_unset();
        session_regenerate_id(true);

        $_SESSION['user'] = $user;
        $_SESSION['userID'] = $user['id'];
        $_SESSION['grupo'] = $user['grupo'];

        require_once __DIR__ . "/helpers.php";
        $_SESSION['letivo'] = getAnoLetivo();

        // 🔥 redirecionamento
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