<?php
// save_score.php — dopisuje wynik gracza do pliku wynik.txt na serwerze.
// Format jednej linii w pliku:  nick;wynik;znacznik_czasu

header('Content-Type: application/json; charset=utf-8');

$dataFile = __DIR__ . '/wynik.txt';

// --- Pobranie i walidacja danych ---
$name  = isset($_POST['name'])  ? trim((string)$_POST['name'])  : '';
$score = isset($_POST['score']) ? (int)$_POST['score']          : null;

// nick: usuń znaki, które zepsułyby format pliku (średniki, nowe linie), przytnij długość
$name = preg_replace('/[\r\n;]+/', ' ', $name);
$name = trim(mb_substr($name, 0, 16));
if ($name === '') {
    $name = 'Łowca';
}

// wynik: musi być liczbą w rozsądnym zakresie
if ($score === null || $score < 0 || $score > 1000000) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Nieprawidłowy wynik.']);
    exit;
}

$line = $name . ';' . $score . ';' . time() . "\n";

// --- Zapis z blokadą pliku (bezpieczne przy wielu graczach naraz) ---
$fp = fopen($dataFile, 'a');
if ($fp === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Nie można otworzyć pliku wynik.txt na serwerze.']);
    exit;
}

if (flock($fp, LOCK_EX)) {
    fwrite($fp, $line);
    fflush($fp);
    flock($fp, LOCK_UN);
} else {
    fclose($fp);
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Nie udało się zablokować pliku do zapisu.']);
    exit;
}
fclose($fp);

echo json_encode(['ok' => true, 'name' => $name, 'score' => $score]);
