<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PostImageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('images');
    }

    private function data(array $extra = []): array
    {
        return array_merge(['header' => 'Photo article', 'description' => str_repeat('Article body ', 4)], $extra);
    }

    public function test_create_multiple_remove_and_existing_article(): void
    {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->post('/api/posts', $this->data(['images' => [UploadedFile::fake()->image('one.png'), UploadedFile::fake()->image('two.jpg')]]), ['Accept' => 'application/json']);
        $response->assertCreated()->assertJsonCount(2, 'data.images');
        $post = Post::findOrFail($response->json('data.id'));
        $paths = $post->images->pluck('path')->all();
        foreach ($paths as $path) {
            Storage::disk('images')->assertExists($path);
        }
        $this->actingAs($user)->post("/api/posts/{$post->id}", $this->data(['_method' => 'PUT', 'remove_images' => [$post->images->first()->id], 'images' => [UploadedFile::fake()->image('three.webp')]]), ['Accept' => 'application/json'])->assertOk()->assertJsonCount(2, 'data.images');
        Storage::disk('images')->assertMissing($paths[0]);
        $old = Post::factory()->create(['user_id' => $user->id]);
        $this->actingAs($user)->getJson("/api/posts/{$old->id}")->assertOk()->assertJsonCount(0, 'data.images');
    }

    public function test_max_count_type_and_ownership(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $owner->id]);
        $url = "/api/posts/{$post->id}";
        $this->actingAs($other)->post($url, $this->data(['_method' => 'PUT', 'images' => [UploadedFile::fake()->image('x.png')]]), ['Accept' => 'application/json'])->assertForbidden();
        $this->actingAs($owner)->post($url, $this->data(['_method' => 'PUT', 'images' => [UploadedFile::fake()->create('evil.svg', 1, 'image/svg+xml')]]), ['Accept' => 'application/json'])->assertUnprocessable();
        $this->actingAs($owner)->post($url, $this->data(['_method' => 'PUT', 'images' => array_fill(0, 6, UploadedFile::fake()->image('x.png'))]), ['Accept' => 'application/json'])->assertUnprocessable();
        $this->assertDatabaseCount('post_images', 0);

        $another = Post::factory()->create(['user_id' => $owner->id]);
        $image = $another->images()->create(['path' => 'posts/other.webp', 'display_order' => 1]);
        $this->actingAs($owner)->putJson($url, $this->data(['remove_images' => [$image->id]]))->assertUnprocessable();
        $this->assertDatabaseHas('post_images', ['id' => $image->id, 'post_id' => $another->id]);
    }

    public function test_specific_ukrainian_validation_messages_and_png_palette_processing(): void
    {
        $user = User::factory()->create();

        $unsupportedResponse = $this->actingAs($user)->post(
            '/api/posts',
            $this->data(['images' => [UploadedFile::fake()->create('document.pdf', 100, 'application/pdf')]]),
            ['Accept' => 'application/json']
        );
        $unsupportedResponse->assertUnprocessable()
            ->assertJsonValidationErrors(['images.0']);
        $this->assertStringContainsString(
            'JPEG, PNG або WebP',
            implode(' ', $unsupportedResponse->json('errors.images\.0') ?? $unsupportedResponse->json('errors')['images.0'] ?? [])
        );

        $oversizedResponse = $this->actingAs($user)->post(
            '/api/posts',
            $this->data(['images' => [UploadedFile::fake()->create('huge.png', 6000, 'image/png')]]),
            ['Accept' => 'application/json']
        );
        $oversizedResponse->assertUnprocessable()
            ->assertJsonValidationErrors(['images.0']);
        $this->assertStringContainsString(
            '5 МБ',
            implode(' ', $oversizedResponse->json('errors')['images.0'] ?? [])
        );

        $tooManyResponse = $this->actingAs($user)->post(
            '/api/posts',
            $this->data(['images' => array_fill(0, 6, UploadedFile::fake()->image('photo.jpg'))]),
            ['Accept' => 'application/json']
        );
        $tooManyResponse->assertUnprocessable()
            ->assertJsonValidationErrors(['images']);
        $this->assertStringContainsString(
            '5 зображень',
            implode(' ', $tooManyResponse->json('errors.images') ?? [])
        );

        $paletteImg = imagecreate(40, 40);
        $bg = imagecolorallocatealpha($paletteImg, 255, 0, 0, 64);
        imagefill($paletteImg, 0, 0, $bg);
        ob_start();
        imagepng($paletteImg);
        $pngBytes = ob_get_clean();
        imagedestroy($paletteImg);

        $paletteFile = UploadedFile::fake()->createWithContent('palette.png', $pngBytes);
        $paletteResponse = $this->actingAs($user)->post(
            '/api/posts',
            $this->data(['images' => [$paletteFile]]),
            ['Accept' => 'application/json']
        );
        $paletteResponse->assertCreated()->assertJsonCount(1, 'data.images');
    }

    public function test_real_3mb_png_upload_compressed_photo_and_five_image_article(): void
    {
        $user = User::factory()->create();

        $width = 1200;
        $height = 900;
        $rawScanlines = '';
        for ($y = 0; $y < $height; $y++) {
            $rawScanlines .= "\x00".random_bytes($width * 3);
        }
        $ihdr = pack('NNccccc', $width, $height, 8, 2, 0, 0, 0);
        $idat = gzcompress($rawScanlines, 0);
        $chunk = fn (string $type, string $data) => pack('N', strlen($data)).$type.$data.pack('N', crc32($type.$data));
        $realLargePngBytes = "\x89PNG\r\n\x1a\n".$chunk('IHDR', $ihdr).$chunk('IDAT', $idat).$chunk('IEND', '');

        $this->assertGreaterThan(2.5 * 1024 * 1024, strlen($realLargePngBytes));
        $this->assertLessThan(5 * 1024 * 1024, strlen($realLargePngBytes));

        $realPngFile = UploadedFile::fake()->createWithContent('real-screenshot-3mb.png', $realLargePngBytes);
        $pngRes = $this->actingAs($user)->post(
            '/api/posts',
            $this->data(['images' => [$realPngFile]]),
            ['Accept' => 'application/json']
        );
        $pngRes->assertCreated()->assertJsonCount(1, 'data.images');
        $storedPngPath = Post::findOrFail($pngRes->json('data.id'))->images->first()->path;
        Storage::disk('images')->assertExists($storedPngPath);
        $storedWebpSize = Storage::disk('images')->size($storedPngPath);
        $this->assertLessThan(1.5 * 1024 * 1024, $storedWebpSize);

        $fiveImages = [
            UploadedFile::fake()->image('photo1.jpg', 1600, 1200),
            UploadedFile::fake()->image('photo2.png', 1400, 1000),
            UploadedFile::fake()->image('photo3.webp', 1200, 1200),
            UploadedFile::fake()->image('photo4.jpg', 1000, 800),
            UploadedFile::fake()->image('photo5.png', 800, 600),
        ];
        $multiRes = $this->actingAs($user)->post(
            '/api/posts',
            $this->data(['images' => $fiveImages]),
            ['Accept' => 'application/json']
        );
        $multiRes->assertCreated()->assertJsonCount(5, 'data.images');
    }
}
