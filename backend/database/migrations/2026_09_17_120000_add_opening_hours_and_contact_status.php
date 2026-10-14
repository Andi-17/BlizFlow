<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->text('opening_hours')->nullable()->after('country');
        });

        Schema::table('contact_messages', function (Blueprint $table) {
            $table->string('status', 20)->default('new')->after('is_read');
            $table->index(['company_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('contact_messages', function (Blueprint $table) {
            $table->dropIndex(['company_id', 'status']);
            $table->dropColumn('status');
        });

        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn('opening_hours');
        });
    }
};
