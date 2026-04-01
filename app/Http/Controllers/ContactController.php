<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Contact;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function store(Request $request, Client $client)
    {
        $this->authorize('update', $client);

        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'role'       => 'nullable|string|max:255',
            'email'      => 'nullable|email|max:255',
            'phone'      => 'nullable|string|max:50',
            'is_primary' => 'boolean',
            'notes'      => 'nullable|string',
        ]);

        if (!empty($validated['is_primary'])) {
            $client->contacts()->update(['is_primary' => false]);
        }

        $client->contacts()->create($validated);

        return back()->with('success', 'Contact added.');
    }

    public function update(Request $request, Contact $contact)
    {
        $this->authorize('update', $contact->client);

        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'role'       => 'nullable|string|max:255',
            'email'      => 'nullable|email|max:255',
            'phone'      => 'nullable|string|max:50',
            'is_primary' => 'boolean',
            'notes'      => 'nullable|string',
        ]);

        if (!empty($validated['is_primary'])) {
            $contact->client->contacts()->where('id', '!=', $contact->id)->update(['is_primary' => false]);
        }

        $contact->update($validated);

        return back()->with('success', 'Contact updated.');
    }

    public function destroy(Contact $contact)
    {
        $this->authorize('update', $contact->client);

        $contact->delete();

        return back()->with('success', 'Contact removed.');
    }
}
