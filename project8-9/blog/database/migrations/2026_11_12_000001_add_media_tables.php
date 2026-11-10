<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->string('avatar_path')->nullable());
        Schema::create('post_images', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->string('path')->unique();
            $table->unsignedTinyInteger('display_order');
            $table->timestamps();
            $table->index(['post_id', 'display_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('post_images');
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('avatar_path'));
    }
};
