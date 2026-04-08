<?php

function isMobile(): bool {
    return preg_match(
        "/(android|iphone|ipad|mobile)/i",
        $_SERVER['HTTP_USER_AGENT'] ?? ''
    );
}

function getAnoLetivo() {

    $mes = date("n"); // 1-12
    $ano = date("Y");

    if ($mes >= 9) {
        return $ano . "_" . ($ano + 1);
    } else {
        return ($ano - 1) . "_" . $ano;
    }
}