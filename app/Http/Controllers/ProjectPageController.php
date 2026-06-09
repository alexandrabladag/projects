<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Project;
use App\Models\ProjectPage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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

    // Import a multi-page mockup (.zip of HTML/CSS/JS/assets) as a single page.
    // The archive is extracted to disk and served as a self-contained mini-site so
    // internal links between pages and relative asset paths keep working.
    public function importMockup(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $validated = $request->validate([
            'title' => 'nullable|string|max:255',
            'file'  => 'required|file|max:102400', // 100MB
        ]);

        $file = $request->file('file');
        if (strtolower($file->getClientOriginalExtension()) !== 'zip') {
            return back()->withErrors(['file' => 'Please upload a .zip archive.']);
        }

        $title = ($validated['title'] ?? null)
            ?: preg_replace('/\.zip$/i', '', $file->getClientOriginalName());

        // Create the page first so we have a stable id for the storage directory.
        $page = $project->pages()->create([
            'title'      => $title,
            'created_by' => $request->user()->id,
            'password'   => strtoupper(substr(md5(rand()), 0, 6)),
        ]);

        $relDir = "mockups/{$page->id}";
        Storage::disk('local')->deleteDirectory($relDir); // clear any leftovers
        $absDir = Storage::disk('local')->path($relDir);
        @mkdir($absDir, 0775, true);

        $zip = new \ZipArchive();
        if ($zip->open($file->getRealPath()) !== true) {
            $page->delete();
            return back()->withErrors(['file' => 'Could not open the ZIP archive.']);
        }

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if ($name === false) continue;
            $name = ltrim(str_replace('\\', '/', $name), '/');

            if ($name === '' || str_ends_with($name, '/')) continue;       // dir entry
            if (str_starts_with($name, '__MACOSX/')) continue;             // macOS junk
            if (str_contains($name, '/.') || str_starts_with($name, '.')) continue; // dotfiles
            if (str_contains($name, '..')) continue;                       // zip-slip guard

            $target = $absDir . '/' . $name;
            @mkdir(dirname($target), 0775, true);
            $stream = $zip->getStream($name);
            if ($stream === false) continue;
            file_put_contents($target, stream_get_contents($stream));
            fclose($stream);
        }
        $zip->close();

        [$rootRel, $entry] = $this->findMockupEntry($relDir);
        if ($entry === null) {
            Storage::disk('local')->deleteDirectory($relDir);
            $page->delete();
            return back()->withErrors(['file' => 'No HTML file was found inside the ZIP.']);
        }

        $page->update(['mockup_path' => $rootRel, 'entry_file' => $entry]);

        return back()->with('success', 'Mockup imported.');
    }

    public function destroy(Project $project, ProjectPage $page)
    {
        $this->authorize('update', $project);
        if ($page->mockup_path) {
            Storage::disk('local')->deleteDirectory("mockups/{$page->id}");
        }
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

    // Public view (no auth) — serves the page's landing content.
    public function publicView(Request $request, string $code)
    {
        $page = ProjectPage::where('share_code', $code)->where('is_shared', true)->firstOrFail();

        // Multi-page mockup — serve the entry HTML from disk.
        if ($page->mockup_path) {
            return $this->serveMockupFile($page, $page->entry_file ?? 'index.html');
        }

        // Full HTML document — serve directly as raw HTML (case-insensitive match)
        $isFullHtml = (bool) preg_match('/<!doctype\s+html|<html[\s>]/i', $page->content ?? '');

        if ($isFullHtml) {
            // Serve verbatim — do NOT rewrite the markup. Some exports embed an entire
            // HTML template as a JSON string in a <script> block; injecting a tag there
            // would corrupt that JSON. The X-Robots-Tag header already handles noindex.
            return response($page->content . $this->titleLabel($page->title), 200, [
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

    // Serves any file inside a shared mockup: /page/{code}/{path}. Sub-pages and
    // their relative assets (css/js/images) resolve here against the mockup root.
    public function mockupAsset(Request $request, string $code, string $path)
    {
        $page = ProjectPage::where('share_code', $code)->where('is_shared', true)->firstOrFail();
        abort_unless($page->mockup_path, 404);
        return $this->serveMockupFile($page, $path);
    }

    // Reads a file from the page's mockup directory and returns it with the right
    // content type. HTML files get a <base> tag injected so their relative links
    // and assets resolve under /page/{code}/ regardless of nesting depth.
    private function serveMockupFile(ProjectPage $page, string $relPath)
    {
        $relPath = ltrim(str_replace('\\', '/', $relPath), '/');
        if ($relPath === '') $relPath = $page->entry_file ?? 'index.html';
        abort_if(str_contains($relPath, '..'), 404);

        $full = trim($page->mockup_path, '/') . '/' . $relPath;
        abort_unless(Storage::disk('local')->exists($full), 404);

        $abs     = Storage::disk('local')->path($full);
        $isHtml  = (bool) preg_match('/\.html?$/i', $relPath);
        $headers = ['X-Robots-Tag' => 'noindex, nofollow'];

        if ($isHtml) {
            $html = $this->injectBase(file_get_contents($abs), "/page/{$page->share_code}/");
            $html .= $this->titleLabel($page->title);
            return response($html, 200, $headers + ['Content-Type' => 'text/html; charset=UTF-8']);
        }

        $headers['Content-Type']  = $this->guessMime($abs, $relPath);
        $headers['Cache-Control'] = 'public, max-age=3600';
        return response(file_get_contents($abs), 200, $headers);
    }

    // Locates the landing HTML inside an extracted archive. Prefers a file named
    // index.html, then the shallowest .html. Returns [rootDir, entryFilename] where
    // rootDir (relative to the disk) becomes the served site root.
    private function findMockupEntry(string $relDir): array
    {
        $htmls = array_values(array_filter(
            Storage::disk('local')->allFiles($relDir),
            fn ($f) => preg_match('/\.html?$/i', $f)
        ));
        if (empty($htmls)) return [null, null];

        usort($htmls, function ($a, $b) {
            $ai = preg_match('/(^|\/)index\.html?$/i', $a) ? 0 : 1;
            $bi = preg_match('/(^|\/)index\.html?$/i', $b) ? 0 : 1;
            return $ai !== $bi ? $ai - $bi : substr_count($a, '/') - substr_count($b, '/');
        });

        return [trim(dirname($htmls[0]), '/'), basename($htmls[0])];
    }

    // Inserts a <base href> just after the opening <head> tag (or prepends if none).
    private function injectBase(string $html, string $base): string
    {
        $tag = '<base href="' . htmlspecialchars($base, ENT_QUOTES) . '">';
        if (preg_match('/<head[^>]*>/i', $html, $m, PREG_OFFSET_CAPTURE)) {
            $pos = $m[0][1] + strlen($m[0][0]);
            return substr($html, 0, $pos) . "\n" . $tag . substr($html, $pos);
        }
        return $tag . $html;
    }

    // Content types for common web assets — finfo tends to mislabel css/js as text/plain.
    private function guessMime(string $abs, string $relPath): string
    {
        $ext = strtolower(pathinfo($relPath, PATHINFO_EXTENSION));
        $map = [
            'css' => 'text/css', 'js' => 'text/javascript', 'mjs' => 'text/javascript',
            'json' => 'application/json', 'svg' => 'image/svg+xml', 'png' => 'image/png',
            'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'gif' => 'image/gif',
            'webp' => 'image/webp', 'ico' => 'image/x-icon', 'woff' => 'font/woff',
            'woff2' => 'font/woff2', 'ttf' => 'font/ttf', 'otf' => 'font/otf',
            'eot' => 'application/vnd.ms-fontobject', 'mp4' => 'video/mp4',
            'webm' => 'video/webm', 'pdf' => 'application/pdf', 'txt' => 'text/plain',
        ];
        return $map[$ext] ?? (mime_content_type($abs) ?: 'application/octet-stream');
    }

    // Floating page-title badge appended to served HTML. A window timer re-asserts it
    // because bundler exports may replace documentElement and wipe injected DOM.
    // json_encode escapes quotes and "/", so a title containing </script> can't break out.
    private function titleLabel(?string $title): string
    {
        return '<script>(function(){var t=' . json_encode((string) $title) . ',ID="__page_label";'
            . 'function e(){if(!document.body||document.getElementById(ID))return;'
            . 'var d=document.createElement("div");d.id=ID;d.textContent=t;'
            . 'd.style.cssText="position:fixed;bottom:12px;right:12px;z-index:2147483647;'
            . 'font:600 12px/1 ui-sans-serif,system-ui,-apple-system,sans-serif;'
            . 'background:rgba(17,24,39,.82);color:#fff;padding:7px 11px;border-radius:8px;'
            . 'box-shadow:0 2px 8px rgba(0,0,0,.18);pointer-events:none;letter-spacing:.2px";'
            . 'document.body.appendChild(d);}'
            . 'try{document.title=t;}catch(_){}e();setInterval(e,800);})();</script>';
    }
}
