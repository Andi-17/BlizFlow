<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ContactMessageRequest;
use App\Models\ContactMessage;

class ContactController extends Controller
{
    public function store(ContactMessageRequest $request)
    {
        $message = ContactMessage::query()->create($request->validated());

        return $this->created([
            'id' => $message->id,
        ], 'Message received');
    }
}
