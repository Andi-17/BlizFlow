<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contact_messages', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->index(['company_id', 'is_read']);
        });

        // Ensure existing companies without email use the owner account email.
        $rows = DB::table('company_user')
            ->where('is_owner', true)
            ->where('status', 'active')
            ->get(['company_id', 'user_id']);

        foreach ($rows as $row) {
            $companyEmail = DB::table('companies')->where('id', $row->company_id)->value('email');
            if (filled($companyEmail)) {
                continue;
            }
            $userEmail = DB::table('users')->where('id', $row->user_id)->value('email');
            if (! filled($userEmail)) {
                continue;
            }
            DB::table('companies')->where('id', $row->company_id)->update(['email' => $userEmail]);
        }
    }

    public function down(): void
    {
        Schema::table('contact_messages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('company_id');
        });
    }
};
