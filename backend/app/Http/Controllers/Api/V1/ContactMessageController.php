<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerResource;
use App\Models\ContactMessage;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class ContactMessageController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('viewAny', ContactMessage::class);

        $messages = ContactMessage::query()
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->string('search')->toString();
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('subject', 'like', "%{$search}%")
                        ->orWhere('message', 'like', "%{$search}%");
                });
            })
            ->when($request->has('is_read'), fn ($query) => $query->where('is_read', $request->boolean('is_read')))
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->string('status')->toString())
            )
            ->latest()
            ->paginate($request->integer('per_page', 15));

        return $this->success($messages);
    }

    public function unreadCount()
    {
        Gate::authorize('viewAny', ContactMessage::class);

        $count = ContactMessage::query()
            ->where(function ($query) {
                $query->where('is_read', false)
                    ->orWhere('status', 'new');
            })
            ->count();

        return $this->success(['count' => $count]);
    }

    public function show(int $contactMessage)
    {
        $message = $this->findCompanyMessage($contactMessage);
        Gate::authorize('view', $message);

        return $this->success($message);
    }

    public function markRead(int $contactMessage)
    {
        $message = $this->findCompanyMessage($contactMessage);
        Gate::authorize('update', $message);

        $message->update([
            'is_read' => true,
            'status' => $message->status === 'new' ? 'contacted' : $message->status,
        ]);

        return $this->success($message->fresh(), 'Marked as read');
    }

    public function updateStatus(Request $request, int $contactMessage)
    {
        $message = $this->findCompanyMessage($contactMessage);
        Gate::authorize('update', $message);

        $data = $request->validate([
            'status' => ['required', 'string', Rule::in(ContactMessage::STATUSES)],
        ]);

        $message->update([
            'status' => $data['status'],
            'is_read' => $data['status'] === 'new' ? false : true,
        ]);

        return $this->success($message->fresh(), 'Status updated');
    }

    public function toCustomer(int $contactMessage)
    {
        $message = $this->findCompanyMessage($contactMessage);
        Gate::authorize('view', $message);
        Gate::authorize('create', Customer::class);

        $customer = null;
        if (filled($message->email)) {
            $customer = Customer::query()
                ->where('email', $message->email)
                ->first();
        }

        if (! $customer) {
            $notes = trim(implode("\n\n", array_filter([
                $message->subject ? 'Subject: '.$message->subject : null,
                $message->message,
            ])));

            $customer = Customer::query()->create([
                'name' => $message->name,
                'email' => $message->email,
                'notes' => $notes !== '' ? $notes : null,
            ]);
        }

        if (! $message->is_read || $message->status === 'new') {
            $message->update([
                'is_read' => true,
                'status' => $message->status === 'new' ? 'contacted' : $message->status,
            ]);
        }

        return $this->success(
            (new CustomerResource($customer))->resolve(),
            'Customer ready',
        );
    }

    protected function findCompanyMessage(int $id): ContactMessage
    {
        return ContactMessage::query()->findOrFail($id);
    }
}
