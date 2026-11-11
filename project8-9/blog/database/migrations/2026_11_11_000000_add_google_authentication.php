<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('google_id')->nullable()->unique();
            $table->string('password')->nullable()->change();
        });
        Schema::create('oauth_exchanges', function (Blueprint $table): void {
            $table->string('code_hash', 64)->primary();
            $table->string('session_hash', 64);
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->timestamp('expires_at')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('oauth_exchanges');
        Schema::table('users', function (Blueprint $table): void {
            $table->dropUnique(['google_id']);
            $table->dropColumn('google_id');
        });
        // Keep passwords nullable: existing Google-only users must not receive fake passwords.
    }
};
