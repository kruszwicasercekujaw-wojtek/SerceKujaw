<?php
// top_scores.php — czyta wynik.txt i zwraca 5 najlepszych wyników jako JSON.

header('Content-Type: application/json; charset=utf-8');

$dataFile = __DIR__ . '/wynik.txt';
$scores = [];

if (file_exists($dataFile)) {
    $fp = fopen($dataFile, 'r');
    if ($fp !== false) {
        if (flock($fp, LOCK_SH)) {
            while (($line = fgets($fp)) !== false) {
                $line = trim($line);
                if ($line === '') continue;
                $parts = explode(';', $line);
                if (count($parts) >= 2) {
                    $scores[] = [
                        'name'  => $parts[0],
                        'score' => (int)$parts[1],
                    ];
                }
            }
            flock($fp, LOCK_UN);
        }
        fclose($fp);
    }
}

usort($scores, function ($a, $b) {
    return $b['score'] - $a['score'];
});

$top = array_slice($scores, 0, 5);

echo json_encode(['ok' => true, 'top' => $top]);
