<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\PageCommenter;
use App\Models\PageCommenterToken;
use App\Models\PageFeedback;
use App\Models\Project;
use App\Models\ProjectPage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
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
            'file'  => 'required|file|max:512000', // 500MB
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

    // ── Client feedback on a shared page (public, no auth) ──────────────────────

    // Returns the comment thread for a shared page as JSON: top-level comments (newest first),
    // each with a recursively nested, chronological `replies` tree (used by the floating widget).
    public function listFeedback(string $code)
    {
        $page = ProjectPage::where('share_code', $code)->where('is_shared', true)->firstOrFail();

        $cols = ['id', 'parent_id', 'page_commenter_id', 'author_name', 'is_admin', 'title', 'body', 'page_path', 'resolved_at', 'created_at', 'updated_at'];
        $rows = $page->feedback()->orderBy('created_at')->get($cols);
        $childrenOf = $rows->whereNotNull('parent_id')->groupBy('parent_id');

        // Recursively attach each comment's children (oldest first) under `replies`.
        $build = function ($comment) use (&$build, $childrenOf) {
            $arr = $comment->toArray();
            $arr['replies'] = ($childrenOf->get($comment->id) ?? collect())
                ->sortBy('created_at')->values()->map($build)->values();
            return $arr;
        };

        $thread = $rows->whereNull('parent_id')->sortByDesc('created_at')->values()->map($build);

        return response()->json($thread->values());
    }

    // Records a client's comment on a shared page. Requires a signed-in commenter account
    // (lightweight name+email+password, see registerCommenter/loginCommenter) — the bearer
    // token proves who authored the comment, so they can edit their own later but not anyone
    // else's. Replies are admin-only and go through the authenticated route below.
    public function storeFeedback(Request $request, string $code)
    {
        $page = ProjectPage::where('share_code', $code)->where('is_shared', true)->firstOrFail();

        $commenter = $this->resolveCommenter($request);
        abort_unless($commenter && $commenter->project_id === $page->project_id, 401);

        $validated = $request->validate([
            'body'      => 'required|string|max:20000',
            'title'     => 'nullable|string|max:255',
            'page_path' => 'nullable|string|max:2000',
        ]);

        // The comment is rich text from the widget's editor — sanitize before storing so
        // it's safe to render in the team's app and the public thread.
        $validated['body'] = $this->sanitizeFeedbackHtml($validated['body']);
        if (trim(strip_tags($validated['body'])) === '') {
            return response()->json(['message' => 'Feedback cannot be empty.', 'errors' => ['body' => ['Feedback cannot be empty.']]], 422);
        }

        // Author identity comes from the account, not the request body.
        $validated['page_commenter_id'] = $commenter->id;
        $validated['author_name']       = $commenter->name;

        $feedback = $page->feedback()->create($validated);

        return response()->json($this->feedbackPayload($feedback), 201);
    }

    // Edits a comment on a shared page. Allowed only for the signed-in account that authored
    // it — so a client can edit their own comment but not anyone else's, and never a team reply.
    public function updateFeedback(Request $request, string $code, $feedbackId)
    {
        $page = ProjectPage::where('share_code', $code)->where('is_shared', true)->firstOrFail();
        $feedback = $page->feedback()->whereKey($feedbackId)->firstOrFail();

        $commenter = $this->resolveCommenter($request);
        $ok = $commenter
            && $commenter->project_id === $page->project_id
            && ! $feedback->is_admin
            && $feedback->page_commenter_id
            && $feedback->page_commenter_id === $commenter->id;
        abort_unless($ok, 403);

        $validated = $request->validate([
            'body'  => 'required|string|max:20000',
            'title' => 'nullable|string|max:255',
        ]);

        $validated['body'] = $this->sanitizeFeedbackHtml($validated['body']);
        if (trim(strip_tags($validated['body'])) === '') {
            return response()->json(['message' => 'Feedback cannot be empty.', 'errors' => ['body' => ['Feedback cannot be empty.']]], 422);
        }

        $feedback->update($validated);

        return response()->json($this->feedbackPayload($feedback));
    }

    // Client reply within a thread — lets a client respond after the team replies. Replies
    // nest under the exact comment being answered. Allowed only to the account that started
    // the thread, so the whole conversation stays between that client and the team.
    public function replyToFeedback(Request $request, string $code, $feedbackId)
    {
        $page = ProjectPage::where('share_code', $code)->where('is_shared', true)->firstOrFail();
        $target = $page->feedback()->whereKey($feedbackId)->firstOrFail();

        $commenter = $this->resolveCommenter($request);
        abort_unless($commenter && $commenter->project_id === $page->project_id, 401);

        // Walk up to the thread root and require the client to own it.
        $root = $this->threadRoot($page, $target);
        abort_unless($root->page_commenter_id === $commenter->id, 403);

        // No replies once the branch is resolved.
        abort_if($target->resolved_at || $root->resolved_at, 403, 'This thread is resolved.');

        $validated = $request->validate(['body' => 'required|string|max:20000']);
        $validated['body'] = $this->sanitizeFeedbackHtml($validated['body']);
        if (trim(strip_tags($validated['body'])) === '') {
            return response()->json(['message' => 'Reply cannot be empty.', 'errors' => ['body' => ['Reply cannot be empty.']]], 422);
        }

        $reply = $page->feedback()->create([
            'parent_id'         => $target->id, // nest under the comment being answered
            'page_commenter_id' => $commenter->id,
            'author_name'       => $commenter->name,
            'is_admin'          => false,
            'body'              => $validated['body'],
        ]);

        return response()->json($this->feedbackPayload($reply), 201);
    }

    // Walks parent_id links up to the top-level comment of a thread. Bounded against cycles.
    private function threadRoot(ProjectPage $page, PageFeedback $node): PageFeedback
    {
        $guard = 0;
        while ($node->parent_id && $guard++ < 100) {
            $parent = $page->feedback()->whereKey($node->parent_id)->first();
            if (! $parent) {
                break;
            }
            $node = $parent;
        }

        return $node;
    }

    // ── Commenter accounts (public, no team auth) ───────────────────────────────

    // Registers a lightweight client account for the shared page's project and returns a
    // bearer token. Accounts are project-scoped: the same email may register per project,
    // and the account can comment on any shared page belonging to that project.
    public function registerCommenter(Request $request, string $code)
    {
        $page = ProjectPage::where('share_code', $code)->where('is_shared', true)->firstOrFail();

        $validated = $request->validate([
            'name'     => 'required|string|max:120',
            'email'    => 'required|email|max:255',
            'password' => 'required|string|min:6|max:255',
        ]);

        if (PageCommenter::where('project_id', $page->project_id)->where('email', $validated['email'])->exists()) {
            throw ValidationException::withMessages([
                'email' => 'That email already has an account for this project — please log in instead.',
            ]);
        }

        $validated['project_id'] = $page->project_id;
        $commenter = PageCommenter::create($validated);

        return response()->json($this->commenterSession($commenter), 201);
    }

    // Logs a client in (within the page's project) and returns a fresh bearer token.
    public function loginCommenter(Request $request, string $code)
    {
        $page = ProjectPage::where('share_code', $code)->where('is_shared', true)->firstOrFail();

        $validated = $request->validate([
            'email'    => 'required|email|max:255',
            'password' => 'required|string|max:255',
        ]);

        $commenter = PageCommenter::where('project_id', $page->project_id)
            ->where('email', $validated['email'])->first();
        if (! $commenter || ! Hash::check($validated['password'], $commenter->password)) {
            throw ValidationException::withMessages([
                'email' => 'Those credentials don\'t match our records.',
            ]);
        }

        return response()->json($this->commenterSession($commenter));
    }

    // Issues a new token row and returns the session payload the widget stores in localStorage.
    private function commenterSession(PageCommenter $commenter): array
    {
        $raw = Str::random(48);
        $commenter->tokens()->create(['token' => hash('sha256', $raw)]);

        return [
            'token'     => $raw, // raw, returned only here
            'commenter' => ['id' => $commenter->id, 'name' => $commenter->name, 'email' => $commenter->email],
        ];
    }

    // Resolves the commenter behind a request from its bearer token (Authorization header,
    // falling back to an auth_token field). Returns null when absent or unknown.
    private function resolveCommenter(Request $request): ?PageCommenter
    {
        $raw = $request->bearerToken() ?: (string) $request->input('auth_token');
        if ($raw === '') {
            return null;
        }

        $row = PageCommenterToken::where('token', hash('sha256', $raw))->first();

        return $row?->commenter;
    }

    // Public fields for one comment, including the owning account id so the widget can show
    // an Edit button only on the viewer's own comments.
    private function feedbackPayload(PageFeedback $feedback): array
    {
        return $feedback->only([
            'id', 'parent_id', 'page_commenter_id', 'author_name', 'is_admin',
            'title', 'body', 'page_path', 'resolved_at', 'created_at', 'updated_at',
        ]);
    }

    // ── Internal feedback management (auth) ─────────────────────────────────────

    // Admin reply to a client comment. Authored by the signed-in team member and flagged
    // is_admin so it renders as a team response in the widget and the panel.
    public function replyFeedback(Request $request, Project $project, ProjectPage $page, PageFeedback $feedback)
    {
        $this->authorize('update', $project);
        abort_unless($feedback->project_page_id === $page->id && $page->project_id === $project->id, 404);

        $validated = $request->validate(['body' => 'required|string|max:20000']);
        $body = $this->sanitizeFeedbackHtml($validated['body']);
        if (trim(strip_tags($body)) === '') {
            return back()->withErrors(['body' => 'Reply cannot be empty.']);
        }

        $page->feedback()->create([
            'parent_id'   => $feedback->id, // nest under the exact comment being answered
            'author_name' => $request->user()->name,
            'is_admin'    => true,
            'body'        => $body,
        ]);

        return back();
    }

    public function resolveFeedback(Project $project, ProjectPage $page, PageFeedback $feedback)
    {
        $this->authorize('update', $project);
        abort_unless($feedback->project_page_id === $page->id && $page->project_id === $project->id, 404);

        // Resolving (or reopening) cascades to the whole subtree, so a resolved branch stays
        // consistent — every reply under it is resolved too and clients can't keep replying.
        $value = $feedback->resolved_at ? null : now();
        $page->feedback()->whereIn('id', $this->subtreeIds($page, $feedback->id))
            ->update(['resolved_at' => $value]);

        return back();
    }

    // Collects the id of a comment plus every descendant reply (depth-first, cycle-guarded).
    private function subtreeIds(ProjectPage $page, int $rootId): array
    {
        $childrenOf = $page->feedback()->get(['id', 'parent_id'])->groupBy('parent_id');

        $ids = [];
        $stack = [$rootId];
        while ($stack && count($ids) < 5000) {
            $id = array_pop($stack);
            if (in_array($id, $ids, true)) {
                continue;
            }
            $ids[] = $id;
            foreach ($childrenOf->get($id) ?? [] as $child) {
                $stack[] = $child->id;
            }
        }

        return $ids;
    }

    public function deleteFeedback(Project $project, ProjectPage $page, PageFeedback $feedback)
    {
        $this->authorize('update', $project);
        abort_unless($feedback->project_page_id === $page->id && $page->project_id === $project->id, 404);

        $feedback->delete();

        return back();
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
            return response($page->content . $this->titleLabel($page->title) . $this->feedbackWidget($page), 200, [
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
            $html .= $this->feedbackWidget($page);
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

    // Sanitizes rich-text feedback: keeps a small set of formatting tags and strips ALL
    // attributes (kills on*/style/href injection), so stored comments are safe to render.
    private function sanitizeFeedbackHtml(string $html): string
    {
        // Browsers wrap each line/paragraph of a contenteditable in <div>/<p>. strip_tags
        // would delete those without a separator and glue the lines together, so turn each
        // block boundary into a <br> first. The opening tag marks the line break (Chrome
        // leaves the first line bare and wraps only subsequent lines); the closing tag drops.
        $html = preg_replace('#<(?:div|p)\b[^>]*>#i', '<br>', $html);
        $html = preg_replace('#</(?:div|p)>#i', '', $html);

        $html = strip_tags($html, '<b><strong><i><em><u><ul><ol><li><br>');
        // Remove every attribute from the surviving opening tags.
        $html = preg_replace('/<([a-z0-9]+)\b[^>]*>/i', '<$1>', $html);

        // Collapse long runs of <br> and trim leading/trailing breaks.
        $html = preg_replace('#(?:<br\s*/?>\s*){3,}#i', '<br><br>', $html);
        $html = preg_replace('#^(?:\s|<br\s*/?>)+#i', '', $html);
        $html = preg_replace('#(?:\s|<br\s*/?>)+$#i', '', $html);

        return trim($html);
    }

    // Floating, toggleable client-feedback widget injected into served mockup HTML.
    // Self-contained vanilla JS (no template literals so PHP heredoc/JS don't collide);
    // posts to the public /page/{code}/feedback endpoint. Re-mounts on a timer because
    // bundler exports may replace documentElement and wipe injected DOM (same as the badge).
    private function feedbackWidget(ProjectPage $page): string
    {
        $base = '/page/' . $page->share_code . '/feedback';

        $js = <<<'JS'
(function(){
  if (window.__pf_init) return; window.__pf_init = true;
  var BASE = "__BASE__", AUTH = BASE.replace(/\/feedback$/,'/auth'), Z = 2147483647, open = false;
  // Full-screen is a sticky view preference so a reload keeps the same layout.
  var full = (function(){ try{ return localStorage.getItem('pf_full')==='1'; }catch(_){ return false; } })();
  var showResolved = false, currentItems = []; // resolved comments are hidden until toggled on
  var FOCUS = null; // comment id to scroll to + highlight after the next render
  // Deep-link helpers: #feedback keeps the drawer open across reloads; #fb-<id> also focuses
  // a specific comment. replaceState keeps the hash in the URL without spamming history.
  function hashId(){ var m=(location.hash||'').match(/^#fb-(\d+)$/); return m?parseInt(m[1],10):null; }
  function setHash(h){ try{ history.replaceState(null,'', h?('#'+h):(location.pathname+location.search)); }catch(_){ if(h) location.hash=h; } }
  var FONT = "13px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif";
  var INP = 'width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:8px;padding:9px 11px;margin-bottom:8px;font:'+FONT;
  function el(tag, css, text){ var e=document.createElement(tag); if(css)e.style.cssText=css; if(text!=null)e.textContent=text; return e; }
  function fmtDate(s){ try{ return new Date(s).toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}); }catch(_){ return ''; } }
  // Stable avatar color per author name.
  function hashColor(s){ var h=0,i; for(i=0;i<(s||'?').length;i++){ h=(h*31+(s||'?').charCodeAt(i))>>>0; } var P=[['#eef1fe','#4f6df5'],['#fef3c7','#b45309'],['#dcfce7','#15803d'],['#fee2e2','#b91c1c'],['#f3e8ff','#7e22ce'],['#cffafe','#0e7490'],['#ffe4e6','#be123c'],['#e0e7ff','#4338ca']]; return P[h%P.length]; }
  // Friendly label for which page/section the comment was left on.
  function pageLabel(p){ if(!p) return ''; var x=p.split('?')[0].split('#')[0].replace(/\/+$/,''); var seg=x.split('/').filter(Boolean).pop()||''; if(!seg||seg.toLowerCase()==='index.html'||/^[a-f0-9]{12}$/.test(seg)) return 'Home'; try{ return decodeURIComponent(seg); }catch(_){ return seg; } }
  // Lightweight client account held by this browser: {token,id,name,email}. Accounts are
  // project-scoped, so the key is namespaced by project — one account works across all of a
  // project's shared pages, but a different project needs its own sign-in.
  var AKEY = 'pf_auth_p__PID__';
  function auth(){ try{ return JSON.parse(localStorage.getItem(AKEY)||'null'); }catch(_){ return null; } }
  function setAuth(a){ try{ a ? localStorage.setItem(AKEY, JSON.stringify(a)) : localStorage.removeItem(AKEY); }catch(_){} }
  function authHeaders(extra){ var h=extra||{}, a=auth(); if(a&&a.token) h['Authorization']='Bearer '+a.token; return h; }

  // Shared styles — placeholder + list indentation for both the editor and rendered bodies.
  var st = el('style'); st.textContent='.pf-ed:empty:before{content:attr(data-ph);color:#9ca3af}.pf-ed:focus{outline:none}.pf-ed ul,.pf-body ul{list-style:disc;padding-left:20px;margin:4px 0}.pf-ed ol,.pf-body ol{list-style:decimal;padding-left:20px;margin:4px 0}.pf-body p,.pf-ed p{margin:4px 0}.pf-focus{box-shadow:0 0 0 2px #4f6df5;transition:box-shadow .2s}';
  (document.head||document.documentElement).appendChild(st);

  // Rich-text editor factory (toolbar + contenteditable) — reused for compose and edit.
  function buildEditor(html, minH){
    var wrap = el('div');
    var bar = el('div','display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px');
    var ed = el('div','width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:8px;padding:10px 12px;font:'+FONT+';min-height:'+(minH||140)+'px;max-height:40vh;overflow:auto;background:#fff;color:#111;text-align:left');
    ed.className='pf-ed'; ed.contentEditable='true'; ed.setAttribute('data-ph','Write your feedback…'); if(html) ed.innerHTML=html;
    function tbtn(label, css, cmd){
      var b = el('button','display:inline-flex;align-items:center;justify-content:center;height:30px;padding:0 11px;white-space:nowrap;line-height:1;border:1px solid #d1d5db;border-radius:6px;background:#fff;cursor:pointer;color:#374151;font:'+css);
      b.type='button'; b.textContent=label;
      b.onmousedown=function(ev){ ev.preventDefault(); };
      b.onclick=function(){ ed.focus(); try{document.execCommand(cmd,false,null);}catch(_){} };
      return b;
    }
    bar.appendChild(tbtn('B','700 13px/1 system-ui','bold'));
    bar.appendChild(tbtn('I','italic 600 13px/1 system-ui','italic'));
    bar.appendChild(tbtn('U','600 13px/1 system-ui','underline'));
    bar.appendChild(tbtn('• List','600 12px/1 system-ui','insertUnorderedList'));
    bar.appendChild(tbtn('1. List','600 12px/1 system-ui','insertOrderedList'));
    wrap.appendChild(bar); wrap.appendChild(ed);
    return { wrap: wrap, ed: ed };
  }

  var btn = el('button','position:fixed;bottom:12px;left:12px;z-index:'+Z+';border:0;cursor:pointer;background:#4f6df5;color:#fff;font:600 '+FONT+';padding:9px 14px;border-radius:9px;box-shadow:0 2px 10px rgba(0,0,0,.22);display:flex;align-items:center;gap:6px');
  btn.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Feedback';

  // Right-side drawer (no backdrop) — or full-window when maximized.
  var DRAWER='position:fixed;top:0;right:0;bottom:0;left:auto;z-index:'+Z+';width:420px;max-width:100vw;flex-direction:column;background:#fff;box-shadow:-10px 0 34px rgba(0,0,0,.2);font:'+FONT+';color:#111';
  var FULL='position:fixed;top:0;right:0;bottom:0;left:0;z-index:'+Z+';width:100vw;max-width:100vw;flex-direction:column;background:#fff;box-shadow:none;font:'+FONT+';color:#111';
  var panel = el('div', DRAWER+';display:none');
  function applyLayout(){
    panel.style.cssText=(full?FULL:DRAWER)+';display:'+(open?'flex':'none');
    // Full screen → thread (left) and composer (right) side by side; drawer → stacked.
    body.style.flexDirection = full ? 'row' : 'column';
    if(full){
      form.style.flex='0 0 auto'; form.style.width='440px'; form.style.maxWidth='42%';
      form.style.borderTop='0'; form.style.borderLeft='1px solid #eee'; form.style.overflow='auto';
      list.style.paddingLeft='28px'; list.style.paddingRight='28px';
    } else {
      form.style.flex='0 0 auto'; form.style.width='auto'; form.style.maxWidth='none';
      form.style.borderTop='1px solid #eee'; form.style.borderLeft='0'; form.style.overflow='visible';
      list.style.paddingLeft='16px'; list.style.paddingRight='16px';
    }
  }
  var head = el('div','flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:15px 18px;background:#111827;color:#fff;font-weight:600;font-size:15px');
  head.appendChild(el('span',null,'Leave feedback'));
  var ctrls = el('div','display:flex;align-items:center;gap:8px');
  var maxbtn = el('button','border:0;background:transparent;color:#fff;cursor:pointer;padding:2px;opacity:.8;display:inline-flex');
  maxbtn.type='button'; maxbtn.setAttribute('aria-label','Toggle full screen');
  var ICON_MAX='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
  var ICON_MIN='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
  maxbtn.innerHTML=full?ICON_MIN:ICON_MAX;
  maxbtn.onclick=function(){ full=!full; try{ localStorage.setItem('pf_full', full?'1':'0'); }catch(_){} maxbtn.innerHTML=full?ICON_MIN:ICON_MAX; applyLayout(); };
  var close = el('button','border:0;background:transparent;color:#fff;cursor:pointer;font:400 22px/1 system-ui;padding:0 2px;opacity:.8');
  close.type='button'; close.setAttribute('aria-label','Close'); close.innerHTML='&times;';
  close.onclick=function(){ setOpen(false); setHash(null); };
  ctrls.appendChild(maxbtn); ctrls.appendChild(close);
  head.appendChild(ctrls);
  // Thin toolbar above the list — holds the "Show resolved" toggle (shown only when there
  // are resolved comments to reveal).
  var resBar = el('div','flex:0 0 auto;display:none;align-items:center;justify-content:flex-end;padding:7px 16px;background:#fff;border-bottom:1px solid #f1f1f1');
  var resToggle = el('button','border:0;background:transparent;color:#4f6df5;cursor:pointer;font:600 12px ui-sans-serif,system-ui,sans-serif;padding:0;display:inline-flex;align-items:center;gap:5px');
  resToggle.type='button';
  resToggle.onclick=function(){ showResolved=!showResolved; render(currentItems); };
  resBar.appendChild(resToggle);
  var list = el('div','flex:1 1 auto;overflow:auto;padding:14px 16px;background:#f9fafb');
  // Footer region — holds either the composer (signed in) or the sign-in/register panel.
  var form = el('div','flex:0 0 auto;padding:14px 16px;border-top:1px solid #eee;background:#fff');
  var body = el('div','flex:1 1 auto;display:flex;min-height:0');
  body.appendChild(list); body.appendChild(form);
  panel.appendChild(head); panel.appendChild(resBar); panel.appendChild(body);

  function setOpen(v){ open=v; applyLayout(); }
  function load(){ fetch(BASE,{headers:{'Accept':'application/json'}}).then(function(r){return r.json();}).then(render).catch(function(){}); }

  function actionBtn(html, onclick){
    var b = el('button','display:inline-flex;align-items:center;gap:5px;border:1px solid #d1d5db;background:#fff;cursor:pointer;color:#374151;font:600 12px ui-sans-serif,system-ui,sans-serif;padding:5px 11px;border-radius:7px');
    b.type='button'; b.innerHTML=html; b.onclick=onclick; return b;
  }
  var PENCIL='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
  var REPLY='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>';

  // Inline reply within the client's own thread (only offered once the team has replied).
  function startReply(card, c){
    var existing = card.querySelector('.pf-reply');
    if(existing){ existing.querySelector('.pf-ed').focus(); return; }
    var box = el('div','margin-top:10px'); box.className='pf-reply';
    var edt = buildEditor('', 84); edt.ed.setAttribute('data-ph','Write a reply…');
    var row = el('div','display:flex;gap:8px;margin-top:8px');
    var send = el('button','flex:1 1 auto;border:0;cursor:pointer;background:#4f6df5;color:#fff;font:600 '+FONT+';padding:9px;border-radius:8px','Send reply');
    var cancel = el('button','flex:0 0 auto;border:1px solid #d1d5db;background:#fff;cursor:pointer;color:#374151;font:600 '+FONT+';padding:9px 14px;border-radius:8px','Cancel');
    row.appendChild(send); row.appendChild(cancel);
    box.appendChild(edt.wrap); box.appendChild(row); card.appendChild(box);
    cancel.onclick=function(){ if(box.parentNode) box.parentNode.removeChild(box); };
    send.onclick=function(){
      if(!(edt.ed.textContent||'').trim()) return;
      send.disabled=true; send.textContent='Sending…';
      fetch(BASE+'/'+c.id+'/reply',{method:'POST',headers:authHeaders({'Content-Type':'application/json','Accept':'application/json'}),body:JSON.stringify({body:edt.ed.innerHTML})})
        .then(function(r){ if(r.status===401){ throw 'auth'; } if(r.status===403){ throw 'forbidden'; } if(!r.ok) throw 0; return r.json(); })
        .then(function(){ load(); })
        .catch(function(e){ alert(e==='auth' ? 'Please sign in again to reply.' : e==='forbidden' ? 'You can only reply in your own thread.' : 'Could not send reply.'); send.disabled=false; send.textContent='Send reply'; });
    };
    edt.ed.focus();
  }

  // Inline edit — allowed only for the comment's own account (enforced again server-side).
  function startEdit(card, c){
    card.innerHTML='';
    var ti = el('input', INP); ti.placeholder='Add feedback title'; ti.value=c.title||'';
    var edt = buildEditor(c.body||'', 120);
    var row = el('div','display:flex;gap:8px;margin-top:8px');
    var save = el('button','flex:1 1 auto;border:0;cursor:pointer;background:#4f6df5;color:#fff;font:600 '+FONT+';padding:9px;border-radius:8px','Save');
    var cancel = el('button','flex:0 0 auto;border:1px solid #d1d5db;background:#fff;cursor:pointer;color:#374151;font:600 '+FONT+';padding:9px 14px;border-radius:8px','Cancel');
    row.appendChild(save); row.appendChild(cancel);
    card.appendChild(ti); card.appendChild(edt.wrap); card.appendChild(row);
    cancel.onclick=function(){ load(); };
    save.onclick=function(){
      if(!(edt.ed.textContent||'').trim()) return;
      save.disabled=true; save.textContent='Saving…';
      fetch(BASE+'/'+c.id,{method:'PUT',headers:authHeaders({'Content-Type':'application/json','Accept':'application/json'}),body:JSON.stringify({body:edt.ed.innerHTML,title:ti.value.trim()})})
        .then(function(r){ if(r.status===401){ throw 'auth'; } if(r.status===403){ throw 'forbidden'; } if(!r.ok) throw 0; return r.json(); })
        .then(function(){ load(); })
        .catch(function(e){ alert(e==='auth' ? 'Please sign in again to edit.' : e==='forbidden' ? 'You can only edit your own comments.' : 'Could not save changes.'); save.disabled=false; save.textContent='Save'; });
    };
    edt.ed.focus();
  }

  // Builds one comment card. Clients can edit their OWN comments, and reply directly under a
  // team member's reply when they own the thread (canReply, passed down for reply cards).
  function buildCard(c, isReply, canReply){
    if(c.resolved_at && !showResolved) return null; // hidden unless "Show resolved" is on
    var nm = (c.author_name||'Anonymous'); var col = hashColor(nm);
    var rbg = c.resolved_at ? '#ecfdf5' : '#fff'; // resolved → green tint instead of fading
    var card = el('div', isReply
      ? 'background:'+rbg+';border:1px solid #eef0f3;border-radius:9px;padding:9px 11px;margin-top:8px'
      : 'background:'+rbg+';border:1px solid #eceef2;border-radius:10px;padding:11px 13px;margin-bottom:8px');
    card.id = 'pf-card-'+c.id;
    // Click a comment to deep-link it (#fb-<id>) so a reload reopens here. Ignore clicks on
    // controls/editors; stopPropagation so the innermost (clicked) card wins over its parents.
    card.addEventListener('click', function(ev){
      if(ev.target.closest('button,a,input,textarea,[contenteditable]')) return;
      ev.stopPropagation(); setHash('fb-'+c.id);
    });
    var top = el('div','display:flex;align-items:center;gap:9px;margin-bottom:7px');
    var sz = isReply ? 24 : 28;
    top.appendChild(el('div','flex:0 0 auto;width:'+sz+'px;height:'+sz+'px;border-radius:50%;background:'+col[0]+';color:'+col[1]+';display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px', nm.charAt(0).toUpperCase()));
    var meta = el('div','flex:1 1 auto;min-width:0');
    var nameRow = el('div','display:flex;align-items:center;gap:6px;flex-wrap:wrap');
    nameRow.appendChild(el('span','font-weight:600;font-size:13px;color:#111827;line-height:1.25', nm));
    if(c.is_admin) nameRow.appendChild(el('span','font-size:10px;font-weight:700;color:#4f6df5;background:#eef1fe;border-radius:6px;padding:2px 7px','Team'));
    meta.appendChild(nameRow);
    meta.appendChild(el('div','font-size:11px;color:#9aa1ad;line-height:1.3', '#'+c.id+' · '+fmtDate(c.created_at)));
    if(c.updated_at && c.updated_at!==c.created_at) meta.appendChild(el('div','font-size:11px;color:#9aa1ad;line-height:1.3;font-style:italic','Edited '+fmtDate(c.updated_at)));
    top.appendChild(meta);
    if(c.resolved_at) top.appendChild(el('span','flex:0 0 auto;font-size:10px;font-weight:600;color:#059669;background:#ecfdf5;border-radius:6px;padding:3px 8px','Resolved'));
    card.appendChild(top);
    var loc = pageLabel(c.page_path);
    if(loc && !isReply){ var chip=el('div','display:inline-flex;align-items:center;gap:4px;font:600 11px ui-monospace,SFMono-Regular,Menlo,monospace;color:#6b7280;background:#f3f4f6;border-radius:6px;padding:3px 8px;margin-bottom:6px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'); chip.innerHTML='<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'; chip.appendChild(document.createTextNode(loc)); card.appendChild(chip); }
    if(c.title) card.appendChild(el('div','font-weight:600;font-size:12.5px;color:#4f6df5;margin-bottom:4px', c.title));
    var bd = el('div'); bd.className='pf-body'; bd.style.cssText='font-size:13px;color:#374151;line-height:1.55;word-break:break-word'; bd.innerHTML=c.body; card.appendChild(bd);
    var me = auth();
    var mine = !c.is_admin && me && c.page_commenter_id && c.page_commenter_id===me.id;
    // Resolved comments are read-only for clients — no editing or replying once closed.
    if(mine && !c.resolved_at){
      var acts = el('div','margin-top:9px;display:flex;gap:8px');
      acts.appendChild(actionBtn(PENCIL+' Edit', function(){ startEdit(card, c); }));
      card.appendChild(acts);
    }
    // Reply control on a team member's reply — only for the client who owns the thread.
    if(isReply && c.is_admin && canReply && !c.resolved_at){
      var ra = el('div','margin-top:9px');
      ra.appendChild(actionBtn(REPLY+' Reply', function(){ startReply(card, c); }));
      card.appendChild(ra);
    }
    // Render the reply tree recursively at any depth. Ownership is set by the root comment
    // (`mine` at the top level) and propagated down so the thread owner can reply throughout.
    var replies = c.replies||[];
    if(replies.length){
      var ownThread = isReply ? canReply : mine;
      var repliesWrap = el('div','margin-top:9px;padding-left:13px;border-left:2px solid #eef0f3'), any=false;
      replies.forEach(function(r){ var rc=buildCard(r, true, ownThread); if(rc){ repliesWrap.appendChild(rc); any=true; } });
      if(any) card.appendChild(repliesWrap);
    }
    return card;
  }

  // Counts resolved comments anywhere in the tree (drives the toggle's visibility/label).
  function countResolved(items){ var n=0; (items||[]).forEach(function(c){ if(c.resolved_at) n++; n+=countResolved(c.replies); }); return n; }

  function render(items){
    currentItems = items || [];
    list.innerHTML='';
    var nRes = countResolved(currentItems);
    if(nRes){ resBar.style.display='flex'; resToggle.textContent = showResolved ? 'Hide resolved' : ('Show resolved ('+nRes+')'); }
    else { resBar.style.display='none'; showResolved=false; }
    var cards = currentItems.map(function(c){ return buildCard(c, false); }).filter(Boolean);
    if(!cards.length){
      var empty = el('div','text-align:center;color:#6b7280;padding:30px 10px');
      empty.innerHTML='<div style="font-size:30px;line-height:1;margin-bottom:8px">\u{1F4AC}</div><div style="font-weight:600;color:#374151">'+(nRes&&!showResolved?'Nothing open':'No comments yet')+'</div><div style="font-size:12px;margin-top:3px;color:#9aa1ad">'+(nRes&&!showResolved?'All feedback here is resolved.':'Be the first to leave feedback.')+'</div>';
      list.appendChild(empty); return;
    }
    cards.forEach(function(card){ list.appendChild(card); });

    // Scroll to + highlight the deep-linked comment once it's in the DOM. If it's resolved
    // and currently hidden, reveal resolved and re-render so the target can be found.
    if(FOCUS!=null){
      var node = document.getElementById('pf-card-'+FOCUS);
      if(node){ FOCUS=null; node.scrollIntoView({block:'center'}); node.classList.add('pf-focus'); setTimeout(function(){ node.classList.remove('pf-focus'); }, 2200); }
      else if(!showResolved && nRes){ showResolved=true; render(currentItems); }
      else { FOCUS=null; }
    }
  }
  // Composer shown when signed in: who-you-are bar + title + rich editor + send.
  function buildComposer(){
    var me = auth();
    var who = el('div','display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;font-size:12px;color:#6b7280');
    who.appendChild(el('span',null,'Commenting as '+(me?me.name:'')));
    var out = el('button','border:0;background:transparent;color:#4f6df5;cursor:pointer;font:600 12px system-ui;padding:0'); out.type='button'; out.textContent='Log out';
    out.onclick=function(){ setAuth(null); renderForm(); load(); };
    who.appendChild(out);
    var title = el('input', INP); title.placeholder='Add feedback title';
    var comp = buildEditor('', 140);
    var send = el('button','margin-top:8px;width:100%;border:0;cursor:pointer;background:#4f6df5;color:#fff;font:600 '+FONT+';padding:11px;border-radius:8px','Send feedback');
    send.onclick=function(){
      if(!(comp.ed.textContent||'').trim()) return;
      send.disabled=true; send.textContent='Sending…';
      fetch(BASE,{method:'POST',headers:authHeaders({'Content-Type':'application/json','Accept':'application/json'}),body:JSON.stringify({body:comp.ed.innerHTML,title:title.value.trim(),page_path:location.pathname})})
        .then(function(r){ if(r.status===401){ throw 'auth'; } if(!r.ok) throw 0; return r.json(); })
        .then(function(){ comp.ed.innerHTML=''; title.value=''; load(); })
        .catch(function(e){ if(e==='auth'){ setAuth(null); renderForm(); alert('Your session expired — please sign in again.'); } else { alert('Could not send feedback. Please try again.'); } })
        .finally(function(){ send.disabled=false; send.textContent='Send feedback'; });
    };
    form.appendChild(who); form.appendChild(title); form.appendChild(comp.wrap); form.appendChild(send);
  }

  // Sign-in / create-account panel shown when signed out (an account is required to comment).
  function buildAuth(){
    var mode = 'login';
    function paint(){
      form.innerHTML='';
      form.appendChild(el('div','font-weight:600;font-size:14px;color:#111827;margin-bottom:3px', mode==='login'?'Client sign in':'Create a client account'));
      form.appendChild(el('div','font-size:12px;color:#6b7280;margin-bottom:11px','Clients sign in to leave feedback on this project’s pages.'));
      var nameI;
      if(mode==='register'){ nameI=el('input',INP); nameI.placeholder='Your name'; form.appendChild(nameI); }
      var emailI=el('input',INP); emailI.type='email'; emailI.placeholder='Email'; form.appendChild(emailI);
      var passI=el('input',INP); passI.type='password'; passI.placeholder=mode==='login'?'Password':'Password (min 6 characters)'; form.appendChild(passI);
      var err=el('div','color:#dc2626;font-size:12px;margin-bottom:8px;display:none'); form.appendChild(err);
      var label=mode==='login'?'Sign in':'Create account & continue';
      var submit=el('button','width:100%;border:0;cursor:pointer;background:#4f6df5;color:#fff;font:600 '+FONT+';padding:11px;border-radius:8px',label); form.appendChild(submit);
      var swap=el('div','text-align:center;font-size:12px;color:#6b7280;margin-top:10px');
      var link=el('button','border:0;background:transparent;color:#4f6df5;cursor:pointer;font:600 12px system-ui;padding:0', mode==='login'?'Create one':'Sign in'); link.type='button';
      swap.appendChild(document.createTextNode(mode==='login'?'No account yet? ':'Already have an account? ')); swap.appendChild(link); form.appendChild(swap);
      link.onclick=function(){ mode = mode==='login'?'register':'login'; paint(); };
      function fail(m){ err.textContent=m||'Something went wrong. Please try again.'; err.style.display='block'; submit.disabled=false; submit.textContent=label; }
      submit.onclick=function(){
        var email=(emailI.value||'').trim(), pass=passI.value||'', nm=nameI?(nameI.value||'').trim():'';
        if(!email||!pass||(mode==='register'&&!nm)){ fail('Please fill in all fields.'); return; }
        submit.disabled=true; submit.textContent='Please wait…'; err.style.display='none';
        var payload = mode==='login' ? {email:email,password:pass} : {name:nm,email:email,password:pass};
        fetch(AUTH+'/'+mode,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)})
          .then(function(r){ return r.json().then(function(j){ return {ok:r.ok,j:j}; }); })
          .then(function(res){
            if(!res.ok){ var e=res.j&&res.j.errors; fail(e ? e[Object.keys(e)[0]][0] : (res.j&&res.j.message)); return; }
            setAuth({token:res.j.token, id:res.j.commenter.id, name:res.j.commenter.name, email:res.j.commenter.email});
            renderForm(); load();
          })
          .catch(function(){ fail('Network error. Please try again.'); });
      };
    }
    paint();
  }

  function renderForm(){ form.innerHTML=''; if(auth()) buildComposer(); else buildAuth(); }

  btn.onclick=function(){ setOpen(!open); if(open){ if(!hashId()) setHash('feedback'); load(); } else { setHash(null); } };

  renderForm();
  function mount(){ if(!document.body) return; if(!btn.isConnected) document.body.appendChild(btn); if(!panel.isConnected) document.body.appendChild(panel); }
  mount(); setInterval(mount,800);

  // Reopen on reload when the URL carries our hash (and focus the linked comment, if any).
  (function(){ var id=hashId(); if(id!=null){ FOCUS=id; setOpen(true); load(); } else if((location.hash||'')==='#feedback'){ setOpen(true); load(); } })();
})();
JS;

        $js = str_replace(['__BASE__', '__PID__'], [$base, (string) $page->project_id], $js);

        return '<script>' . $js . '</script>';
    }
}
