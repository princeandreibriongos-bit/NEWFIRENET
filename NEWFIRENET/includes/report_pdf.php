<?php

function firenet_pdf_escape_text(string $text): string
{
    $text = preg_replace('/[^\x09\x0A\x0D\x20-\x7E]/', '?', $text) ?? '';
    return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text);
}

function firenet_report_pdf_logo_path(): string
{
    return dirname(__DIR__) . '/assets/img/bfpmakatilogo.jpg';
}

function firenet_report_pdf_format_datetime(?string $value): string
{
    $value = trim((string) $value);
    if ($value === '') {
        return '-';
    }

    $timestamp = strtotime($value);
    if ($timestamp === false) {
        return $value;
    }

    return date('M j, Y g:i A', $timestamp);
}

function firenet_report_pdf_format_status(?string $value): string
{
    $value = strtolower(trim((string) $value));
    if ($value === 'fire_out') {
        return 'Fire Out';
    }
    if ($value === 'under_control') {
        return 'Under Control';
    }
    if ($value === 'newly_reported') {
        return 'Newly Reported';
    }

    return $value !== '' ? ucwords(str_replace('_', ' ', $value)) : '-';
}

final class FirenetReportPdfDocument
{
    private const PAGE_WIDTH = 612.0;
    private const PAGE_HEIGHT = 792.0;
    private const MARGIN_X = 42.0;
    private const MARGIN_TOP = 36.0;
    private const MARGIN_BOTTOM = 52.0;
    private const CONTENT_WIDTH = self::PAGE_WIDTH - (self::MARGIN_X * 2);

    private const BRAND = [179, 25, 38];
    private const BRAND_DARK = [122, 16, 25];
    private const MUTED = [90, 103, 122];
    private const BORDER = [215, 221, 231];
    private const BODY = [31, 41, 55];

    /** @var list<string> */
    private array $pageStreams = [''];

    private int $pageIndex = 0;

    private float $cursorY = self::MARGIN_TOP;

    /** @var array{width:int,height:int,data:string}|null */
    private ?array $logoImage = null;

    private string $footerGeneratedAt = '';

    public function __construct(?string $logoPath = null)
    {
        $this->footerGeneratedAt = gmdate('M j, Y g:i A') . ' UTC';
        $logoPath = $logoPath ?? firenet_report_pdf_logo_path();
        if (is_file($logoPath)) {
            $info = @getimagesize($logoPath);
            if (is_array($info) && ($info[2] ?? 0) === IMAGETYPE_JPEG) {
                $data = file_get_contents($logoPath);
                if (is_string($data) && $data !== '') {
                    $this->logoImage = [
                        'width' => (int) ($info[0] ?? 0),
                        'height' => (int) ($info[1] ?? 0),
                        'data' => $data,
                    ];
                }
            }
        }
    }

    public function renderIncidentArchive(array $exportData): void
    {
        $report = is_array($exportData['report'] ?? null) ? $exportData['report'] : [];
        $timeline = is_array($exportData['timeline'] ?? null) ? $exportData['timeline'] : [];

        $this->drawPageHeader($report);
        $this->drawMetaStrip($report);
        $this->sectionTitle('Overview');
        $this->fieldLine('Case ID', '#' . (string) ((int) ($report['incident_case_id'] ?? $report['report_id'] ?? 0)));
        $this->fieldLine('Report ID', (string) ((int) ($report['report_id'] ?? 0)));
        $this->fieldLine('Station', trim((string) ($report['station_name'] ?? '')) . ' (' . trim((string) ($report['station_code'] ?? '')) . ')');
        $this->fieldLine('Title', (string) ($report['title'] ?? 'Untitled incident'));
        $this->fieldLine('Created By', (string) ($report['creator_username'] ?? '-'));
        $this->fieldLine('Closed By', (string) ($report['updated_by_username'] ?? '-'));
        $this->fieldLine('Created At', firenet_report_pdf_format_datetime((string) ($report['created_at'] ?? '')));
        $this->fieldLine('Finished At', firenet_report_pdf_format_datetime((string) ($report['incident_finished_at'] ?? '')));

        $this->sectionTitle('Incident Details');
        $this->fieldLine('Status', firenet_report_pdf_format_status((string) ($report['incident_status'] ?? '')));
        $this->fieldLine('Stage', (string) ($report['stage_name'] ?? $report['stage_code'] ?? '-'));
        $this->fieldLine('Alarm Level', (string) ($report['alarm_level'] ?? '-'));
        $this->fieldLine('Location', (string) ($report['incident_location'] ?? '-'));
        $this->fieldLine('Caller', (string) ($report['caller_name'] ?? '-'));
        $this->fieldLine('Incident Started', firenet_report_pdf_format_datetime((string) ($report['incident_started_at'] ?? '')));

        $remarks = trim((string) ($report['incident_remarks'] ?? $report['description'] ?? ''));
        $this->sectionTitle('Remarks');
        $this->paragraph($remarks !== '' ? $remarks : 'No remarks recorded.');

        $this->sectionTitle('Incident Timeline');
        if ($timeline === []) {
            $this->paragraph('No timeline entries recorded.');
        } else {
            foreach ($timeline as $index => $entry) {
                $this->timelineEntry((int) $index + 1, (string) $entry);
            }
        }
    }

    public function output(): string
    {
        $pageCount = count($this->pageStreams);
        for ($i = 0; $i < $pageCount; $i++) {
            $this->pageIndex = $i;
            $this->drawPageFooter($i + 1, $pageCount);
        }

        $objects = [];
        $objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';

        $fontRegularId = 3;
        $fontBoldId = 4;
        $imageId = $this->logoImage ? 5 : null;
        $nextId = $imageId ? 6 : 5;

        $pageIds = [];
        $contentIds = [];
        for ($i = 0; $i < $pageCount; $i++) {
            $contentIds[] = $nextId++;
            $pageIds[] = $nextId++;
        }

        $kids = array_map(static fn (int $id): string => $id . ' 0 R', $pageIds);
        $objects[2] = '<< /Type /Pages /Kids [' . implode(' ', $kids) . '] /Count ' . $pageCount . ' >>';
        $objects[$fontRegularId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
        $objects[$fontBoldId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';

        if ($imageId !== null && $this->logoImage) {
            $objects[$imageId] = sprintf(
                "<< /Type /XObject /Subtype /Image /Width %d /Height %d /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length %d >>\nstream\n%s\nendstream",
                $this->logoImage['width'],
                $this->logoImage['height'],
                strlen($this->logoImage['data']),
                $this->logoImage['data']
            );
        }

        for ($i = 0; $i < $pageCount; $i++) {
            $stream = $this->pageStreams[$i];
            $objects[$contentIds[$i]] = '<< /Length ' . strlen($stream) . " >>\nstream\n" . $stream . "\nendstream";

            $resources = '/Font << /F1 ' . $fontRegularId . ' 0 R /F2 ' . $fontBoldId . ' 0 R >>';
            if ($imageId !== null) {
                $resources .= ' /XObject << /Im1 ' . $imageId . ' 0 R >>';
            }

            $objects[$pageIds[$i]] = sprintf(
                '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %.0f %.0f] /Resources << %s >> /Contents %d 0 R >>',
                self::PAGE_WIDTH,
                self::PAGE_HEIGHT,
                $resources,
                $contentIds[$i]
            );
        }

        ksort($objects, SORT_NUMERIC);
        $maxId = max(array_keys($objects));

        $pdf = "%PDF-1.4\n";
        $offsets = [0];
        for ($id = 1; $id <= $maxId; $id++) {
            $offsets[$id] = strlen($pdf);
            $pdf .= $id . " 0 obj\n" . ($objects[$id] ?? '<<>>') . "\nendobj\n";
        }

        $xrefPos = strlen($pdf);
        $pdf .= "xref\n0 " . ($maxId + 1) . "\n";
        $pdf .= "0000000000 65535 f \n";
        for ($id = 1; $id <= $maxId; $id++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$id]);
        }

        $pdf .= "trailer\n<< /Size " . ($maxId + 1) . " /Root 1 0 R >>\n";
        $pdf .= "startxref\n" . $xrefPos . "\n%%EOF";

        return $pdf;
    }

    private function drawPageHeader(array $report): void
    {
        $this->fillRect(0, 0, self::PAGE_WIDTH, 78, self::BRAND);
        $this->fillRect(0, 74, self::PAGE_WIDTH, 4, self::BRAND_DARK);

        $logoSize = 48.0;
        $logoX = self::MARGIN_X;
        $logoY = 14.0;
        if ($this->logoImage) {
            $this->fillRect($logoX - 3, $logoY - 3, $logoSize + 6, $logoSize + 6, [255, 255, 255]);
            $this->drawImage('Im1', $logoX, $logoY, $logoSize, $logoSize);
        }

        $textX = $this->logoImage ? $logoX + $logoSize + 14 : self::MARGIN_X;
        $stationName = trim((string) ($report['station_name'] ?? 'Fire Station'));
        $isFireOut = strtolower(trim((string) ($report['incident_status'] ?? ''))) === 'fire_out';
        $subtitle = $isFireOut
            ? 'Official Fire-Out Incident Report Archive'
            : 'Official Incident Report Export';

        $this->textAt($textX, 24, 'FireNet', 'F2', 20, [255, 255, 255]);
        $this->textAt($textX, 44, $stationName !== '' ? $stationName : 'Fire Station', 'F2', 12, [255, 255, 255]);
        $this->textAt($textX, 60, $subtitle, 'F1', 10, [255, 230, 232]);

        $this->cursorY = 96;
    }

    private function drawMetaStrip(array $report): void
    {
        $caseId = (int) ($report['incident_case_id'] ?? $report['report_id'] ?? 0);
        $title = trim((string) ($report['title'] ?? 'Untitled incident'));
        $location = trim((string) ($report['incident_location'] ?? ''));
        $status = strtolower(trim((string) ($report['incident_status'] ?? '')));
        $statusLabel = strtoupper(firenet_report_pdf_format_status($status));
        $badge = $this->statusBadgeStyle($status, $statusLabel);

        $this->ensureSpace(54);
        $top = $this->cursorY;
        $this->strokeRect(self::MARGIN_X, $top, self::CONTENT_WIDTH, 48, self::BORDER);
        $this->fillRect(self::MARGIN_X, $top, 4, 48, self::BRAND);

        $this->textAt(self::MARGIN_X + 14, $top + 14, 'CASE #' . (string) $caseId, 'F2', 14, self::BRAND);
        $this->textAt(self::MARGIN_X + 14, $top + 30, $title !== '' ? $title : 'Incident report', 'F2', 11, self::BODY);
        if ($location !== '') {
            $locationLine = $this->truncate($location, 72);
            $this->textAt(self::MARGIN_X + 14, $top + 44, $locationLine, 'F1', 9, self::MUTED);
        }

        $badgeWidth = max(74.0, $this->estimateTextWidth($badge['text'], 10) + 22);
        $badgeX = self::PAGE_WIDTH - self::MARGIN_X - $badgeWidth;
        $this->fillRect($badgeX, $top + 12, $badgeWidth, 22, $badge['background']);
        $this->textAt($badgeX + 11, $top + 27, $badge['text'], 'F2', 10, $badge['color']);

        $this->cursorY = $top + 62;
    }

    /** @return array{text:string,background:list{int,int,int},color:list{int,int,int}} */
    private function statusBadgeStyle(string $status, string $statusLabel): array
    {
        if ($status === 'fire_out') {
            return [
                'text' => 'FIRE OUT',
                'background' => [232, 247, 236],
                'color' => [22, 101, 52],
            ];
        }

        if ($status === 'under_control') {
            return [
                'text' => 'UNDER CONTROL',
                'background' => [255, 247, 237],
                'color' => [180, 83, 9],
            ];
        }

        return [
            'text' => $statusLabel !== '' && $statusLabel !== '-' ? $statusLabel : 'ACTIVE',
            'background' => [239, 246, 255],
            'color' => [30, 64, 175],
        ];
    }

    private function sectionTitle(string $title): void
    {
        $this->ensureSpace(28);
        $this->cursorY += 8;
        $this->textAt(self::MARGIN_X, $this->cursorY + 2, $title, 'F2', 13, self::BODY);
        $lineY = $this->cursorY + 10;
        $this->strokeLine(self::MARGIN_X, $lineY, self::MARGIN_X + self::CONTENT_WIDTH, $lineY, self::BORDER);
        $this->cursorY = $lineY + 14;
    }

    private function fieldLine(string $label, string $value): void
    {
        $value = trim($value);
        if ($value === '') {
            $value = '-';
        }

        $labelText = $label . ':';
        $labelWidth = $this->estimateTextWidth($labelText, 10) + 8;
        $valueX = self::MARGIN_X + min(150, max(110, $labelWidth));
        $valueWidth = self::CONTENT_WIDTH - ($valueX - self::MARGIN_X);
        $lines = $this->wrapText($value, $valueWidth, 10);

        $this->ensureSpace(15 * count($lines));
        $startY = $this->cursorY;
        $this->textAt(self::MARGIN_X, $startY, $labelText, 'F2', 10, self::MUTED);

        foreach ($lines as $index => $line) {
            $this->textAt($valueX, $startY + ($index * 15), $line, 'F1', 10, self::BODY);
        }

        $this->cursorY = $startY + (count($lines) * 15) + 2;
    }

    private function paragraph(string $text): void
    {
        $lines = $this->wrapText($text, self::CONTENT_WIDTH, 10);
        $this->ensureSpace((count($lines) * 14) + 4);
        foreach ($lines as $index => $line) {
            $this->textAt(self::MARGIN_X, $this->cursorY + ($index * 14), $line, 'F1', 10, self::BODY);
        }
        $this->cursorY += (count($lines) * 14) + 8;
    }

    private function timelineEntry(int $number, string $entry): void
    {
        $bulletX = self::MARGIN_X + 2;
        $textX = self::MARGIN_X + 18;
        $textWidth = self::CONTENT_WIDTH - 18;
        $lines = $this->wrapText($entry, $textWidth, 10);
        $this->ensureSpace((count($lines) * 14) + 6);

        $this->fillRect($bulletX, $this->cursorY - 1, 6, 6, self::BRAND);
        $prefix = sprintf('%02d  ', $number);
        $this->textAt($textX, $this->cursorY + 4, $prefix . $lines[0], 'F1', 10, self::BODY);
        for ($i = 1, $count = count($lines); $i < $count; $i++) {
            $this->textAt($textX + 18, $this->cursorY + 4 + ($i * 14), $lines[$i], 'F1', 10, self::BODY);
        }

        $this->cursorY += (count($lines) * 14) + 6;
    }

    private function drawPageFooter(int $pageNumber, int $pageCount): void
    {
        $footerTop = self::PAGE_HEIGHT - 34;
        $this->strokeLine(self::MARGIN_X, $footerTop, self::PAGE_WIDTH - self::MARGIN_X, $footerTop, self::BORDER);
        $this->textAt(self::MARGIN_X, self::PAGE_HEIGHT - 20, 'Generated by FireNet · ' . $this->footerGeneratedAt, 'F1', 9, self::MUTED);
        $this->textAt(self::PAGE_WIDTH - self::MARGIN_X - 40, self::PAGE_HEIGHT - 20, 'Page ' . $pageNumber . ' of ' . $pageCount, 'F1', 9, self::MUTED);
    }

    private function ensureSpace(float $height): void
    {
        if ($this->cursorY + $height <= self::PAGE_HEIGHT - self::MARGIN_BOTTOM) {
            return;
        }

        $this->pageStreams[] = '';
        $this->pageIndex = count($this->pageStreams) - 1;
        $this->cursorY = self::MARGIN_TOP + 8;
        $this->textAt(self::MARGIN_X, $this->cursorY, 'FireNet Incident Report Archive (continued)', 'F2', 11, self::BRAND);
        $this->cursorY += 22;
    }

    private function textAt(float $x, float $topY, string $text, string $font, float $size, array $rgb): void
    {
        if ($text === '') {
            return;
        }

        $r = $rgb[0] / 255;
        $g = $rgb[1] / 255;
        $b = $rgb[2] / 255;
        $pdfY = self::PAGE_HEIGHT - $topY;
        $this->pageStreams[$this->pageIndex] .= sprintf(
            "BT /%s %.2f Tf %.3f %.3f %.3f rg 1 0 0 1 %.2f %.2f Tm (%s) Tj ET\n",
            $font,
            $size,
            $r,
            $g,
            $b,
            $x,
            $pdfY,
            firenet_pdf_escape_text($text)
        );
    }

    private function fillRect(float $x, float $topY, float $width, float $height, array $rgb): void
    {
        $r = $rgb[0] / 255;
        $g = $rgb[1] / 255;
        $b = $rgb[2] / 255;
        $pdfY = self::PAGE_HEIGHT - $topY - $height;
        $this->pageStreams[$this->pageIndex] .= sprintf(
            "q %.3f %.3f %.3f rg %.2f %.2f %.2f %.2f re f Q\n",
            $r,
            $g,
            $b,
            $x,
            $pdfY,
            $width,
            $height
        );
    }

    private function strokeRect(float $x, float $topY, float $width, float $height, array $rgb): void
    {
        $r = $rgb[0] / 255;
        $g = $rgb[1] / 255;
        $b = $rgb[2] / 255;
        $pdfY = self::PAGE_HEIGHT - $topY - $height;
        $this->pageStreams[$this->pageIndex] .= sprintf(
            "q %.3f %.3f %.3f RG 1 w %.2f %.2f %.2f %.2f re S Q\n",
            $r,
            $g,
            $b,
            $x,
            $pdfY,
            $width,
            $height
        );
    }

    private function strokeLine(float $x1, float $topY1, float $x2, float $topY2, array $rgb): void
    {
        $r = $rgb[0] / 255;
        $g = $rgb[1] / 255;
        $b = $rgb[2] / 255;
        $this->pageStreams[$this->pageIndex] .= sprintf(
            "q %.3f %.3f %.3f RG 1 w %.2f %.2f m %.2f %.2f l S Q\n",
            $r,
            $g,
            $b,
            $x1,
            self::PAGE_HEIGHT - $topY1,
            $x2,
            self::PAGE_HEIGHT - $topY2
        );
    }

    private function drawImage(string $name, float $x, float $topY, float $width, float $height): void
    {
        $pdfY = self::PAGE_HEIGHT - $topY - $height;
        $this->pageStreams[$this->pageIndex] .= sprintf(
            "q %.2f 0 0 %.2f %.2f %.2f cm /%s Do Q\n",
            $width,
            $height,
            $x,
            $pdfY,
            $name
        );
    }

    /** @return list<string> */
    private function wrapText(string $text, float $maxWidth, float $fontSize): array
    {
        $text = preg_replace('/\s+/u', ' ', trim($text)) ?? '';
        if ($text === '') {
            return ['-'];
        }

        $words = explode(' ', $text);
        $lines = [];
        $current = '';
        foreach ($words as $word) {
            $candidate = $current === '' ? $word : $current . ' ' . $word;
            if ($this->estimateTextWidth($candidate, $fontSize) <= $maxWidth) {
                $current = $candidate;
                continue;
            }

            if ($current !== '') {
                $lines[] = $current;
            }
            $current = $word;
        }

        if ($current !== '') {
            $lines[] = $current;
        }

        return $lines !== [] ? $lines : ['-'];
    }

    private function estimateTextWidth(string $text, float $fontSize): float
    {
        return strlen($text) * $fontSize * 0.52;
    }

    private function truncate(string $text, int $maxChars): string
    {
        if (strlen($text) <= $maxChars) {
            return $text;
        }

        return rtrim(substr($text, 0, max(0, $maxChars - 1))) . '…';
    }
}

function firenet_generate_incident_report_pdf(array $exportData): string
{
    $document = new FirenetReportPdfDocument();
    $document->renderIncidentArchive($exportData);
    return $document->output();
}
