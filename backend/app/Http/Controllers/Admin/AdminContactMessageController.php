<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use Illuminate\Http\Request;

class AdminContactMessageController extends Controller
{
    public function index(Request $request)
    {
        $messages = ContactMessage::query()
            ->when($request->has('is_read'), fn ($query) => $query->where('is_read', $request->boolean('is_read')))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return $this->success($messages);
    }

    public function markRead(ContactMessage $message)
    {
        $message->update(['is_read' => true]);

        return $this->success($message, 'Marked as read');
    }
}
