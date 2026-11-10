<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class ImageService
{
    public function store(UploadedFile $file, string $folder, int $maxDimension): string
    {
        $realPath = $file->getRealPath();
        $bytes = $realPath ? @file_get_contents($realPath) : false;
        if (! is_string($bytes) || $bytes === '') {
            throw new RuntimeException('Не вдалося прочитати завантажений файл зображення.');
        }
        $info = @getimagesizefromstring($bytes);
        if (! $info || ! in_array($info['mime'], ['image/jpeg', 'image/png', 'image/webp'], true)
            || $info[0] * $info[1] > 25_000_000) {
            throw new RuntimeException('Некоректне або завелике зображення.');
        }
        $source = @imagecreatefromstring($bytes);
        if (! $source) {
            throw new RuntimeException('Не вдалося прочитати зображення.');
        }
        if (function_exists('imagepalettetotruecolor')) {
            @imagepalettetotruecolor($source);
        }
        $ratio = min(1, $maxDimension / max($info[0], $info[1]));
        $width = max(1, (int) round($info[0] * $ratio));
        $height = max(1, (int) round($info[1] * $ratio));
        $image = imagecreatetruecolor($width, $height);
        imagealphablending($image, false);
        imagesavealpha($image, true);
        $transparent = imagecolorallocatealpha($image, 0, 0, 0, 127);
        imagefilledrectangle($image, 0, 0, $width, $height, $transparent);
        imagecopyresampled($image, $source, 0, 0, 0, 0, $width, $height, $info[0], $info[1]);
        ob_start();
        imagewebp($image, null, 80);
        $processed = ob_get_clean();
        imagedestroy($source);
        imagedestroy($image);
        if (! $processed) {
            throw new RuntimeException('Не вдалося обробити зображення.');
        }
        $path = $folder.'/'.Str::uuid().'.webp';
        if (! Storage::disk('images')->put($path, $processed, ['ContentType' => 'image/webp', 'CacheControl' => 'private, max-age=3600'])) {
            throw new RuntimeException('Не вдалося зберегти зображення.');
        }

        return $path;
    }

    public function delete(?string $path): void
    {
        if ($path) {
            Storage::disk('images')->delete($path);
        }
    }

    public function url(?string $path): ?string
    {
        return $path ? Storage::disk('images')->temporaryUrl($path, now()->addHour()) : null;
    }
}
