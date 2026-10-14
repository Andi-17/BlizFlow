<?php

namespace App\Models;

use App\Traits\BelongsToCompany;
use Illuminate\Database\Eloquent\Model;

class ContactMessage extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'name',
        'email',
        'subject',
        'message',
        'is_read',
        'status',
        'company_id',
    ];

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
        ];
    }

    public const STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'];
}
