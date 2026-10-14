<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\PublicCompanyContactRequest;
use App\Http\Resources\PublicCompanyResource;
use App\Mail\BusinessLandingContactMail;
use App\Models\Company;
use App\Models\ContactMessage;
use App\Support\MailSender;
use Illuminate\Support\Facades\Log;

class PublicCompanyController extends Controller
{
    public function show(string $slug)
    {
        $company = $this->findPublicCompany($slug);
        if (! $company) {
            return $this->error('Business page not found.', 404);
        }

        return $this->success(new PublicCompanyResource($company));
    }

    public function contact(PublicCompanyContactRequest $request, string $slug)
    {
        $company = $this->findPublicCompany($slug);
        if (! $company) {
            return $this->error('Business page not found.', 404);
        }

        $contactEmail = $company->contactEmail();
        if (! filled($contactEmail)) {
            return $this->error('This business has no contact email yet.', 422);
        }

        $data = $request->validated();

        ContactMessage::query()->create([
            'company_id' => $company->id,
            'name' => $data['name'],
            'email' => $data['email'],
            'subject' => $data['subject'] ?? ('Landing page · '.$company->name),
            'message' => $data['message'],
            'is_read' => false,
            'status' => 'new',
        ]);

        $sendResult = MailSender::send(
            $contactEmail,
            new BusinessLandingContactMail(
                $company,
                $data['name'],
                $data['email'],
                $data['message'],
                $data['subject'] ?? null,
            )
        );

        if (! ($sendResult['delivered'] ?? false) && filled($sendResult['error'] ?? null)) {
            Log::warning('Business landing contact mail issue', [
                'company_id' => $company->id,
                'error' => $sendResult['error'],
                'channel' => $sendResult['channel'] ?? null,
            ]);
        }

        return $this->success([
            'delivered' => (bool) ($sendResult['delivered'] ?? false),
        ], 'Message sent to the business');
    }

    protected function findPublicCompany(string $slug): ?Company
    {
        return Company::query()
            ->where('slug', $slug)
            ->where('is_active', true)
            ->where('is_public', true)
            ->with('settings')
            ->first();
    }
}
