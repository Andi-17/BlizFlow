<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->string('provider', 32)->default('free')->after('plan_id');
            $table->string('paysera_order_id')->nullable()->unique()->after('stripe_subscription_id');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->string('provider', 32)->nullable()->after('subscription_id');
            $table->string('provider_reference')->nullable()->after('provider');
            $table->unique('provider_reference');
        });

        Schema::create('billing_checkouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained('plans')->restrictOnDelete();
            $table->string('provider', 32);
            $table->string('order_id')->unique();
            $table->unsignedInteger('amount_cents');
            $table->string('currency', 3)->default('eur');
            $table->string('status', 32)->default('pending');
            $table->string('success_url')->nullable();
            $table->string('cancel_url')->nullable();
            $table->json('meta')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_checkouts');

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['provider', 'provider_reference']);
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn(['provider', 'paysera_order_id']);
        });
    }
};
