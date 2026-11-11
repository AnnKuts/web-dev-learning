<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (Schema::getIndexes('posts') as $index) {
            if (($index['columns'][0] ?? null) === 'user_id') {
                return;
            }
        }
        Schema::table('posts', function (Blueprint $table): void {
            $table->index('user_id', 'posts_user_id_lab7_idx');
        });
    }

    public function down(): void
    {
        foreach (Schema::getIndexes('posts') as $index) {
            if ($index['name'] === 'posts_user_id_lab7_idx') {
                Schema::table('posts', function (Blueprint $table): void {
                    $table->dropIndex('posts_user_id_lab7_idx');
                });

                return;
            }
        }
    }
};
