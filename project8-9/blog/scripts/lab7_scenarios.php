<?php

require dirname(__DIR__).'/vendor/autoload.php';
$app = require dirname(__DIR__).'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Post;
use App\Services\PostService;
use Illuminate\Support\Facades\DB;

$approvedPath = getenv('LAB7_BENCH_DB_PATH');
$databasePath = config('database.connections.sqlite.database');
$tempDirectories = array_filter([realpath(sys_get_temp_dir()), realpath('/tmp')]);
$inTemporaryDirectory = is_string($approvedPath) && is_file($approvedPath)
    && count(array_filter($tempDirectories, fn ($directory) => str_starts_with(realpath($approvedPath), $directory.DIRECTORY_SEPARATOR))) > 0;
if (! app()->environment('local', 'testing')
    || config('database.default') !== 'sqlite'
    || config('cache.default') !== 'array'
    || ! is_string($approvedPath)
    || ! is_string($databasePath)
    || ! is_file($approvedPath)
    || is_link($approvedPath)
    || realpath($approvedPath) !== realpath($databasePath)
    || ! $inTemporaryDirectory) {
    fwrite(STDERR, "Refusing benchmark: require local/testing, SQLite file in system temp, CACHE_STORE=array, and matching LAB7_BENCH_DB_PATH.\n");
    exit(1);
}
if (Post::count() === 0) {
    fwrite(STDERR, "Refusing benchmark: the approved database has no articles. Seed isolated fixture data separately.\n");
    exit(1);
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
$grouped = ['queries' => $queryCount, 'elapsed_ms' => round((microtime(true) - $start) * 1000, 3), 'count_for_author' => $counts[$posts->first()->user_id] ?? null];
$index = DB::select("PRAGMA index_list('posts')");
$explain = DB::select('EXPLAIN QUERY PLAN SELECT * FROM posts WHERE user_id = ?', [$posts->first()->user_id]);
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
