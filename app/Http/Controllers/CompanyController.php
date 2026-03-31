<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CompanyController extends Controller
{
    public function edit()
    {
        $company = Company::first() ?? new Company();

        return Inertia::render('Settings/Company', [
            'company' => $company,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'email'          => 'nullable|email|max:255',
            'phone'          => 'nullable|string|max:50',
            'address_line_1' => 'nullable|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city'           => 'nullable|string|max:255',
            'state'          => 'nullable|string|max:255',
            'postal_code'    => 'nullable|string|max:20',
            'country'        => 'nullable|string|max:255',
            'tax_id'         => 'nullable|string|max:100',
            'website'        => 'nullable|string|max:255',
            'logo'           => 'nullable|image|max:2048',
            'base_currency'  => 'nullable|string|max:10',
            'invoice_prefix'       => 'nullable|string|max:20',
            'invoice_format'       => 'nullable|string|max:100',
            'proposal_prefix'      => 'nullable|string|max:20',
            'proposal_format'      => 'nullable|string|max:100',
            'next_invoice_number'  => 'nullable|integer|min:1',
            'next_proposal_number' => 'nullable|integer|min:1',
            'number_padding'       => 'nullable|integer|min:1|max:10',
        ]);

        $company = Company::first() ?? new Company();

        if ($request->hasFile('logo')) {
            if ($company->logo_path) {
                Storage::disk('public')->delete($company->logo_path);
            }
            $validated['logo_path'] = $request->file('logo')->store('logos', 'public');
        }

        unset($validated['logo']);

        $company->fill($validated);
        $company->save();

        return back()->with('success', 'Company information updated.');
    }
}
