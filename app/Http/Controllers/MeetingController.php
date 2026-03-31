<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use App\Models\Project;
use Illuminate\Http\Request;

class MeetingController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        // Convert comma-separated attendees string to array
        if (is_string($request->attendees)) {
            $parsed = array_values(array_filter(array_map('trim', explode(',', $request->attendees))));
            $request->merge(['attendees' => count($parsed) ? $parsed : null]);
        }

        $validated = $request->validate([
            'type'      => 'required|in:kickoff,review,checkin,presentation,discovery,other',
            'title'     => 'required|string|max:255',
            'date'      => 'required|date',
            'time'      => 'nullable|string|max:20',
            'duration'  => 'nullable|string|max:50',
            'location'  => 'nullable|string|max:255',
            'attendees' => 'nullable|array',
            'attendees.*' => 'string|max:100',
            'notes'     => 'nullable|string',
        ]);

        $project->meetings()->create(array_merge($validated, ['status' => 'scheduled']));

        return back()->with('success', 'Meeting scheduled.');
    }

    public function update(Request $request, Project $project, Meeting $meeting)
    {
        $this->authorize('update', $meeting->project);

        if (is_string($request->attendees)) {
            $parsed = array_values(array_filter(array_map('trim', explode(',', $request->attendees))));
            $request->merge(['attendees' => count($parsed) ? $parsed : null]);
        }

        $validated = $request->validate([
            'title'     => 'required|string|max:255',
            'date'      => 'required|date',
            'time'      => 'nullable|string|max:20',
            'duration'  => 'nullable|string|max:50',
            'location'  => 'nullable|string|max:255',
            'attendees' => 'nullable|array',
            'notes'     => 'nullable|string',
        ]);

        $meeting->update($validated);

        return back()->with('success', 'Meeting updated.');
    }

    public function updateStatus(Request $request, Meeting $meeting)
    {
        $this->authorize('update', $meeting->project);

        $request->validate(['status' => 'required|in:scheduled,completed,cancelled']);

        $meeting->update(['status' => $request->status]);

        return back()->with('success', 'Meeting status updated.');
    }

    public function destroy(Meeting $meeting)
    {
        $this->authorize('update', $meeting->project);
        $meeting->delete();
        return back()->with('success', 'Meeting deleted.');
    }
}
