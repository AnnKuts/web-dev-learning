<?php

require dirname(__DIR__).'/vendor/autoload.php';
$app = require dirname(__DIR__).'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Post;
use App\Models\User;
use App\Services\PostService;
use Illuminate\Support\Facades\DB;

$user = User::firstOrFail();
if (Post::count() === 0) {
    for ($i = 1; $i <= 100; $i++) {
        Post::create(['user_id' => $user->id, 'header' => "Benchmark article $i", 'description' => str_repeat('Text ', 20)]);
    }
}
$posts = Post::latest()->limit(15)->get();
$queryCount = 0;
DB::listen(function () use (&$queryCount): void {
    $queryCount++;
});
$start = microtime(true);
foreach ($posts as $post) {
    DB::table('posts')->whereNull('deleted_at')->where('user_id', $post->user_id)->count();
}
$naive = ['queries' => $queryCount, 'elapsed_ms' => round((microtime(true) - $start) * 1000, 3)];
$queryCount = 0;
$start = microtime(true);
$counts = DB::table('posts')->selectRaw('user_id, COUNT(*) AS cnt')->whereNull('deleted_at')->whereIn('user_id', $posts->pluck('user_id')->unique())->groupBy('user_id')->pluck('cnt', 'user_id');
$grouped = ['queries' => $queryCount, 'elapsed_ms' => round((microtime(true) - $start) * 1000, 3), 'count_for_author' => $counts[$user->id]];
$index = DB::select("PRAGMA index_list('posts')");
$explain = DB::select('EXPLAIN QUERY PLAN SELECT * FROM posts WHERE user_id = ?', [$user->id]);
$service = app(PostService::class);
$queryCount = 0;
$start = microtime(true);
$service->listRecent(10);
$cold = ['queries' => $queryCount, 'elapsed_ms' => round((microtime(true) - $start) * 1000, 3)];
$queryCount = 0;
$start = microtime(true);
$service->listRecent(10);
$warm = ['queries' => $queryCount, 'elapsed_ms' => round((microtime(true) - $start) * 1000, 3)];
echo json_encode(compact('naive', 'grouped', 'index', 'explain', 'cold', 'warm'), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), PHP_EOL;
