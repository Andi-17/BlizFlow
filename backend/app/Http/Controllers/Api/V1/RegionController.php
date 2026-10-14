<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\RegionDefaults;

class RegionController extends Controller
{
    public function index()
    {
        return $this->success([
            'countries' => RegionDefaults::countries(),
        ]);
    }
}
