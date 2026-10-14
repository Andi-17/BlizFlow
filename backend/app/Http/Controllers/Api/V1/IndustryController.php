<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\IndustryCatalog;

class IndustryController extends Controller
{
    public function index()
    {
        return $this->success(IndustryCatalog::listForApi());
    }
}
