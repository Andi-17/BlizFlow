<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('username', 50)->nullable()->unique()->after('name');
        });

        $users = DB::table('users')->select('id', 'email', 'name')->orderBy('id')->get();
        $used = [];

        foreach ($users as $user) {
            $base = $this->baseUsername($user->email, $user->name);
            $candidate = $base;
            $suffix = 1;

            while (isset($used[$candidate])) {
                $candidate = $base.$suffix;
                $suffix++;
            }

            $used[$candidate] = true;
            DB::table('users')->where('id', $user->id)->update(['username' => $candidate]);
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['username']);
            $table->dropColumn('username');
        });
    }

    private function baseUsername(?string $email, ?string $name): string
    {
        $fromEmail = $email ? Str::before($email, '@') : '';
        $raw = $fromEmail !== '' ? $fromEmail : ($name ?: 'user');
        $cleaned = preg_replace('/[^a-zA-Z0-9._]/', '', str_replace(' ', '.', $raw)) ?? '';
        $slug = Str::lower(trim($cleaned, '._'));

        if ($slug === '' || strlen($slug) < 3) {
            $slug = 'user'.Str::lower(Str::random(4));
        }

        return Str::limit($slug, 40, '');
    }
};
