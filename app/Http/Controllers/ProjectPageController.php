<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Project;
use App\Models\ProjectPage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectPageController extends Controller
{
    public function store(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'title'   => 'required|string|max:255',
            'content' => 'nullable|string',
        ]);

        // Auto-generate a simple 6-char password
        $password = strtoupper(substr(md5(rand()), 0, 6));

        $project->pages()->create(array_merge($validated, [
            'created_by' => $request->user()->id,
            'password'   => $password,
        ]));

        return back()->with('success', 'Page created.');
    }

    public function update(Request $request, Project $project, ProjectPage $page)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'title'    => 'required|string|max:255',
            'content'  => 'nullable|string',
            'password' => 'nullable|string|max:100',
        ]);

        $page->update($validated);

        return back()->with('success', 'Page updated.');
    }

    public function destroy(Project $project, ProjectPage $page)
    {
        $this->authorize('update', $project);
        $page->delete();
        return back()->with('success', 'Page deleted.');
    }

    public function toggleShare(Project $project, ProjectPage $page)
    {
        $this->authorize('update', $project);

        if ($page->is_shared) {
            $page->update(['is_shared' => false, 'share_code' => null]);
        } else {
            $code = substr(md5($page->id . now()->timestamp . rand()), 0, 12);
            $page->update(['is_shared' => true, 'share_code' => $code]);
        }

        return back()->with('success', $page->is_shared ? 'Page shared.' : 'Page unshared.');
    }

    // Public view (no auth)
    public function publicView(Request $request, string $code)
    {
        $page = ProjectPage::where('share_code', $code)->where('is_shared', true)->firstOrFail();

        // Full HTML document — serve directly as raw HTML (case-insensitive match)
        $isFullHtml = (bool) preg_match('/<!doctype\s+html|<html[\s>]/i', $page->content ?? '');

        if ($isFullHtml) {
            // Serve verbatim — do NOT rewrite the markup. Some exports embed an entire
            // HTML template as a JSON string in a <script> block; injecting a tag there
            // would corrupt that JSON. The X-Robots-Tag header already handles noindex.
            //
            // A small page-title badge is APPENDED at the very end (clear of any embedded
            // JSON) via a window-level timer that re-asserts it. Bundler-style exports do
            // document.documentElement.replaceWith(...), wiping injected DOM, so a one-shot
            // append would vanish; the timer re-adds it after the page renders. json_encode
            // escapes quotes and "/", so a title containing </script> can't break out.
            $label = '<script>(function(){var t=' . json_encode($page->title) . ',ID="__page_label";'
                . 'function e(){if(!document.body||document.getElementById(ID))return;'
                . 'var d=document.createElement("div");d.id=ID;d.textContent=t;'
                . 'd.style.cssText="position:fixed;bottom:12px;right:12px;z-index:2147483647;'
                . 'font:600 12px/1 ui-sans-serif,system-ui,-apple-system,sans-serif;'
                . 'background:rgba(17,24,39,.82);color:#fff;padding:7px 11px;border-radius:8px;'
                . 'box-shadow:0 2px 8px rgba(0,0,0,.18);pointer-events:none;letter-spacing:.2px";'
                . 'document.body.appendChild(d);}'
                . 'try{document.title=t;}catch(_){}e();setInterval(e,800);})();</script>';

            return response($page->content . $label, 200, [
                'Content-Type' => 'text/html; charset=UTF-8',
                'X-Robots-Tag' => 'noindex, nofollow',
            ]);
        }

        // Simple content — render with Inertia wrapper
        $page->load('project');
        $company = Company::first();

        return Inertia::render('Pages/PublicPage', [
            'page'    => $page,
            'company' => $company ? ['name' => $company->name, 'logo_path' => $company->logo_path] : null,
        ]);
    }
}
