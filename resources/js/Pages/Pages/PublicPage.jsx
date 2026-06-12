import { useRef, useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { MessageSquare, Maximize2, Minimize2, FileText, Pencil, Reply } from 'lucide-react';

// Stable avatar color per author name.
const AVATAR_COLORS = [['#eef1fe', '#4f6df5'], ['#fef3c7', '#b45309'], ['#dcfce7', '#15803d'], ['#fee2e2', '#b91c1c'], ['#f3e8ff', '#7e22ce'], ['#cffafe', '#0e7490'], ['#ffe4e6', '#be123c'], ['#e0e7ff', '#4338ca']];
function avatarColor(name) {
    const s = name || '?';
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
// Friendly label for which page/section the comment was left on.
function pageLabel(p) {
    if (!p) return '';
    const seg = p.split('?')[0].split('#')[0].replace(/\/+$/, '').split('/').filter(Boolean).pop() || '';
    if (!seg || seg.toLowerCase() === 'index.html' || /^[a-f0-9]{12}$/.test(seg)) return 'Home';
    try { return decodeURIComponent(seg); } catch (e) { return seg; }
}

// Toolbar of formatting buttons that act on the given editor ref.
function Toolbar({ edRef }) {
    const fmt = (cmd) => { edRef.current?.focus(); try { document.execCommand(cmd, false, null); } catch (e) {} };
    const B = ({ cmd, children, className = '' }) => (
        <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => fmt(cmd)}
            className={`inline-flex items-center justify-center h-[30px] px-2.5 leading-none whitespace-nowrap border border-[#d1d5db] rounded-md bg-white text-[#374151] text-[13px] hover:bg-gray-50 ${className}`}>
            {children}
        </button>
    );
    return (
        <div className="flex flex-wrap gap-1.5 mb-2">
            <B cmd="bold" className="font-bold">B</B>
            <B cmd="italic" className="italic font-semibold">I</B>
            <B cmd="underline" className="underline font-semibold">U</B>
            <B cmd="insertUnorderedList" className="font-semibold text-[12px]">• List</B>
            <B cmd="insertOrderedList" className="font-semibold text-[12px]">1. List</B>
        </div>
    );
}

// Floating, toggleable client-feedback drawer — mirrors the one injected into raw mockup
// HTML, but as a React component for simple-content pages. Account-based (project-scoped),
// with nested replies, resolve hiding, and #fb-<id> deep-links that survive a reload.
function FeedbackWidget({ code, projectId }) {
    const base = `/page/${code}/feedback`;
    const authUrl = `/page/${code}/auth`;
    const authKey = `pf_auth_p${projectId}`;

    const [open, setOpen] = useState(false);
    const [full, setFull] = useState(() => { try { return localStorage.getItem('pf_full') === '1'; } catch (e) { return false; } });
    const [items, setItems] = useState([]);
    const [auth, setAuthState] = useState(() => { try { return JSON.parse(localStorage.getItem(authKey) || 'null'); } catch (e) { return null; } });

    const [title, setTitle] = useState('');
    const [sending, setSending] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);
    const [replyingId, setReplyingId] = useState(null);
    const [replyBusy, setReplyBusy] = useState(false);
    const [showResolved, setShowResolved] = useState(false); // resolved hidden until toggled
    const [focusId, setFocusId] = useState(null);            // deep-linked comment to highlight

    // Sign-in / register form state.
    const [authMode, setAuthMode] = useState('login');
    const [authName, setAuthName] = useState('');
    const [authEmail, setAuthEmail] = useState('');
    const [authPass, setAuthPass] = useState('');
    const [authErr, setAuthErr] = useState('');
    const [authBusy, setAuthBusy] = useState(false);

    const composeRef = useRef();
    const editRef = useRef();
    const replyRef = useRef();

    const fmtDateTime = (s) => { try { return new Date(s).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } };
    const flatten = (list) => (list || []).reduce((a, c) => a.concat(c, flatten(c.replies)), []);
    const countResolved = (list) => (list || []).reduce((n, c) => n + (c.resolved_at ? 1 : 0) + countResolved(c.replies), 0);

    const setAuth = (a) => { setAuthState(a); try { a ? localStorage.setItem(authKey, JSON.stringify(a)) : localStorage.removeItem(authKey); } catch (e) {} };
    const authHeaders = (extra) => { const h = extra || {}; if (auth?.token) h['Authorization'] = 'Bearer ' + auth.token; return h; };

    const load = () => { fetch(base, { headers: { Accept: 'application/json' } }).then(r => r.json()).then(setItems).catch(() => {}); };

    // Deep-link: #feedback keeps the drawer open across reloads; #fb-<id> also focuses a comment.
    const setHash = (h) => { try { history.replaceState(null, '', h ? '#' + h : location.pathname + location.search); } catch (e) { if (h) location.hash = h; } };
    const toggle = () => { const next = !open; setOpen(next); if (next) { if (!/^#fb-\d+$/.test(location.hash)) setHash('feedback'); load(); } else setHash(null); };
    const closeDrawer = () => { setOpen(false); setHash(null); };
    const toggleFull = () => { setFull(f => { const v = !f; try { localStorage.setItem('pf_full', v ? '1' : '0'); } catch (e) {} return v; }); };

    // Reopen on reload when the URL carries our hash.
    useEffect(() => {
        const m = (location.hash || '').match(/^#fb-(\d+)$/);
        if (m) { setFocusId(parseInt(m[1], 10)); setOpen(true); load(); }
        else if (location.hash === '#feedback') { setOpen(true); load(); }
    }, []);

    // Populate & focus the edit editor when a comment enters edit mode.
    useEffect(() => {
        if (editingId && editRef.current) {
            const c = flatten(items).find(x => x.id === editingId);
            editRef.current.innerHTML = c?.body || '';
            editRef.current.focus();
        }
    }, [editingId]);
    useEffect(() => { if (replyingId && replyRef.current) replyRef.current.focus(); }, [replyingId]);

    // Scroll to + highlight the deep-linked comment; reveal resolved if it's hidden.
    useEffect(() => {
        if (focusId == null || !open) return;
        const node = document.getElementById('pf-card-' + focusId);
        if (node) {
            node.scrollIntoView({ block: 'center' });
            node.classList.add('pf-focus');
            const t = setTimeout(() => node.classList.remove('pf-focus'), 2200);
            setFocusId(null);
            return () => clearTimeout(t);
        } else if (!showResolved && countResolved(items) > 0) {
            setShowResolved(true);
        }
    }, [items, focusId, open, showResolved]);

    const submitAuth = () => {
        const email = authEmail.trim(), pass = authPass, nm = authName.trim();
        if (!email || !pass || (authMode === 'register' && !nm)) { setAuthErr('Please fill in all fields.'); return; }
        setAuthBusy(true); setAuthErr('');
        const payload = authMode === 'login' ? { email, password: pass } : { name: nm, email, password: pass };
        fetch(`${authUrl}/${authMode}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
            .then(r => r.json().then(j => ({ ok: r.ok, j })))
            .then(({ ok, j }) => {
                if (!ok) { const e = j?.errors; setAuthErr(e ? e[Object.keys(e)[0]][0] : (j?.message || 'Something went wrong.')); return; }
                setAuth({ token: j.token, id: j.commenter.id, name: j.commenter.name, email: j.commenter.email });
                setAuthPass(''); load();
            })
            .catch(() => setAuthErr('Network error. Please try again.'))
            .finally(() => setAuthBusy(false));
    };

    const send = () => {
        const ed = composeRef.current;
        if (!ed || !ed.textContent.trim()) return;
        setSending(true);
        fetch(base, { method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }), body: JSON.stringify({ body: ed.innerHTML, title: title.trim(), page_path: window.location.pathname }) })
            .then(r => { if (r.status === 401) throw new Error('auth'); if (!r.ok) throw new Error(); return r.json(); })
            .then(() => { if (composeRef.current) composeRef.current.innerHTML = ''; setTitle(''); load(); })
            .catch(e => { if (e.message === 'auth') { setAuth(null); alert('Your session expired — please sign in again.'); } else alert('Could not send feedback. Please try again.'); })
            .finally(() => setSending(false));
    };

    const beginEdit = (c) => { setReplyingId(null); setEditTitle(c.title || ''); setEditingId(c.id); };
    const saveEdit = (c) => {
        const ed = editRef.current;
        if (!ed || !ed.textContent.trim()) return;
        setSavingEdit(true);
        fetch(`${base}/${c.id}`, { method: 'PUT', headers: authHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }), body: JSON.stringify({ body: ed.innerHTML, title: editTitle.trim() }) })
            .then(r => { if (r.status === 401) throw new Error('auth'); if (r.status === 403) throw new Error('forbidden'); if (!r.ok) throw new Error(); return r.json(); })
            .then(() => { setEditingId(null); load(); })
            .catch(e => alert(e.message === 'auth' ? 'Please sign in again to edit.' : e.message === 'forbidden' ? 'You can only edit your own comments.' : 'Could not save changes.'))
            .finally(() => setSavingEdit(false));
    };

    const sendReply = (c) => {
        const ed = replyRef.current;
        if (!ed || !ed.textContent.trim()) return;
        setReplyBusy(true);
        fetch(`${base}/${c.id}/reply`, { method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }), body: JSON.stringify({ body: ed.innerHTML }) })
            .then(r => { if (r.status === 401) throw new Error('auth'); if (r.status === 403) throw new Error('forbidden'); if (!r.ok) throw new Error(); return r.json(); })
            .then(() => { setReplyingId(null); load(); })
            .catch(e => alert(e.message === 'auth' ? 'Please sign in again to reply.' : e.message === 'forbidden' ? 'You can only reply in your own thread.' : 'Could not send reply.'))
            .finally(() => setReplyBusy(false));
    };

    // Click a comment to deep-link it; ignore clicks on controls/editors.
    const cardClick = (c, ev) => {
        if (ev.target.closest('button,a,input,textarea,[contenteditable]')) return;
        ev.stopPropagation(); setHash('fb-' + c.id);
    };

    // Clients edit their OWN comments and reply under a team reply within a thread they own.
    const renderCard = (c, isReply, canReply) => {
        if (c.resolved_at && !showResolved) return null; // hidden until toggled
        const mine = !c.is_admin && auth && c.page_commenter_id === auth.id;
        const ownThread = isReply ? canReply : mine;
        return (
            <div key={c.id} id={`pf-card-${c.id}`} onClick={e => cardClick(c, e)} className={`border ${isReply ? 'border-[#eef0f3] rounded-[9px] p-[9px_11px] mt-2' : 'border-[#eceef2] rounded-[10px] p-[11px_13px] mb-2'} ${c.resolved_at ? 'bg-emerald-50' : 'bg-white'}`}>
                <div className="flex items-center gap-2.5 mb-1.5">
                    <div className={`flex-none ${isReply ? 'w-6 h-6' : 'w-7 h-7'} rounded-full flex items-center justify-center font-bold text-[12px]`} style={{ background: avatarColor(c.author_name)[0], color: avatarColor(c.author_name)[1] }}>
                        {(c.author_name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-[13px] text-[#111827] leading-tight">{c.author_name || 'Anonymous'}</span>
                            {c.is_admin && <span className="text-[10px] font-bold text-[#4f6df5] bg-[#eef1fe] rounded-md px-1.5 py-0.5">Team</span>}
                        </div>
                        <div className="text-[11px] text-[#9aa1ad] leading-tight">#{c.id} · {c.created_at && fmtDateTime(c.created_at)}</div>
                        {c.updated_at && c.updated_at !== c.created_at && (
                            <div className="text-[11px] italic text-[#9aa1ad] leading-tight">Edited {fmtDateTime(c.updated_at)}</div>
                        )}
                    </div>
                    {c.resolved_at && <span className="flex-none text-[10px] font-semibold text-[#059669] bg-[#ecfdf5] rounded-md px-2 py-0.5">Resolved</span>}
                </div>
                {!isReply && pageLabel(c.page_path) && (
                    <div className="inline-flex items-center gap-1 font-mono font-semibold text-[11px] text-[#6b7280] bg-[#f3f4f6] rounded-md px-2 py-0.5 mb-1.5 max-w-full truncate">
                        <FileText size={11} /> {pageLabel(c.page_path)}
                    </div>
                )}
                {editingId === c.id ? (
                    <div>
                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Add feedback title" className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 mb-2 text-[13px]" />
                        <Toolbar edRef={editRef} />
                        <div ref={editRef} contentEditable suppressContentEditableWarning data-ph="Write your feedback…"
                            className="pf-ed w-full border border-[#d1d5db] rounded-lg px-3 py-2.5 text-[13px] min-h-[120px] max-h-[40vh] overflow-auto text-left focus:outline-none focus:border-[#4f6df5]" />
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => saveEdit(c)} disabled={savingEdit} className="flex-1 bg-[#4f6df5] text-white font-semibold py-2 rounded-lg disabled:opacity-60">{savingEdit ? 'Saving…' : 'Save'}</button>
                            <button onClick={() => setEditingId(null)} className="border border-[#d1d5db] text-[#374151] font-semibold py-2 px-3.5 rounded-lg">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <>
                        {c.title && <div className="font-semibold text-[12.5px] text-[#4f6df5] mb-1">{c.title}</div>}
                        <div className="pf-body text-[13px] text-[#374151] leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: c.body }} />
                        {mine && !c.resolved_at && (
                            <button type="button" onClick={() => beginEdit(c)} className="mt-2.5 inline-flex items-center gap-1.5 border border-[#d1d5db] rounded-md px-3 py-1.5 text-[12px] font-semibold text-[#374151] hover:bg-gray-50">
                                <Pencil size={12} /> Edit
                            </button>
                        )}
                        {isReply && c.is_admin && canReply && !c.resolved_at && (
                            <button type="button" onClick={() => { setEditingId(null); setReplyingId(c.id); }} className="mt-2.5 inline-flex items-center gap-1.5 border border-[#d1d5db] rounded-md px-3 py-1.5 text-[12px] font-semibold text-[#374151] hover:bg-gray-50">
                                <Reply size={12} /> Reply
                            </button>
                        )}
                    </>
                )}
                {replyingId === c.id && (
                    <div className="mt-2.5">
                        <Toolbar edRef={replyRef} />
                        <div ref={replyRef} contentEditable suppressContentEditableWarning data-ph="Write a reply…"
                            className="pf-ed w-full border border-[#d1d5db] rounded-lg px-3 py-2.5 text-[13px] min-h-[84px] max-h-[40vh] overflow-auto text-left focus:outline-none focus:border-[#4f6df5]" />
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => sendReply(c)} disabled={replyBusy} className="flex-1 bg-[#4f6df5] text-white font-semibold py-2 rounded-lg disabled:opacity-60">{replyBusy ? 'Sending…' : 'Send reply'}</button>
                            <button onClick={() => setReplyingId(null)} className="border border-[#d1d5db] text-[#374151] font-semibold py-2 px-3.5 rounded-lg">Cancel</button>
                        </div>
                    </div>
                )}
                {(c.replies || []).length > 0 && (
                    <div className="mt-2.5 pl-3.5 border-l-2 border-[#eef0f3]">
                        {(c.replies || []).map(r => renderCard(r, true, ownThread))}
                    </div>
                )}
            </div>
        );
    };

    const resolvedCount = countResolved(items);
    const cards = items.map(c => renderCard(c, false)).filter(Boolean);

    const thread = (
        <>
            {resolvedCount > 0 && (
                <div className="flex justify-end mb-2">
                    <button type="button" onClick={() => setShowResolved(v => !v)} className="text-[12px] font-semibold text-[#4f6df5] hover:text-[#6380f7]">
                        {showResolved ? 'Hide resolved' : `Show resolved (${resolvedCount})`}
                    </button>
                </div>
            )}
            {cards.length === 0 ? (
                <div className="text-center text-[#6b7280] py-8">
                    <div className="text-[30px] leading-none mb-2">💬</div>
                    <div className="font-semibold text-[#374151]">{resolvedCount > 0 ? 'Nothing open' : 'No comments yet'}</div>
                    <div className="text-[12px] text-[#9aa1ad] mt-0.5">{resolvedCount > 0 ? 'All feedback here is resolved.' : 'Be the first to leave feedback.'}</div>
                </div>
            ) : cards}
        </>
    );

    const composer = (
        <>
            <div className="flex items-center justify-between mb-2.5 text-[12px] text-[#6b7280]">
                <span>Commenting as {auth?.name}</span>
                <button type="button" onClick={() => setAuth(null)} className="font-semibold text-[#4f6df5]">Log out</button>
            </div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Add feedback title" className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 mb-2 text-[13px]" />
            <Toolbar edRef={composeRef} />
            <div ref={composeRef} contentEditable suppressContentEditableWarning data-ph="Write your feedback…"
                className="pf-ed w-full border border-[#d1d5db] rounded-lg px-3 py-2.5 text-[13px] min-h-[140px] max-h-[40vh] overflow-auto text-left focus:outline-none focus:border-[#4f6df5]" />
            <button onClick={send} disabled={sending} className="mt-2.5 w-full bg-[#4f6df5] text-white font-semibold py-2.5 rounded-lg disabled:opacity-60">
                {sending ? 'Sending…' : 'Send feedback'}
            </button>
        </>
    );

    const authPanel = (
        <>
            <div className="font-semibold text-[14px] text-[#111827] mb-0.5">{authMode === 'login' ? 'Client sign in' : 'Create a client account'}</div>
            <div className="text-[12px] text-[#6b7280] mb-3">Clients sign in to leave feedback on this project’s pages.</div>
            {authMode === 'register' && <input value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Your name" className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 mb-2 text-[13px]" />}
            <input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Email" className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 mb-2 text-[13px]" />
            <input type="password" value={authPass} onChange={e => setAuthPass(e.target.value)} placeholder={authMode === 'login' ? 'Password' : 'Password (min 6 characters)'} className="w-full border border-[#d1d5db] rounded-lg px-3 py-2 mb-2 text-[13px]" />
            {authErr && <div className="text-[12px] text-red-600 mb-2">{authErr}</div>}
            <button onClick={submitAuth} disabled={authBusy} className="w-full bg-[#4f6df5] text-white font-semibold py-2.5 rounded-lg disabled:opacity-60">
                {authBusy ? 'Please wait…' : (authMode === 'login' ? 'Sign in' : 'Create account & continue')}
            </button>
            <div className="text-center text-[12px] text-[#6b7280] mt-2.5">
                {authMode === 'login' ? 'No account yet? ' : 'Already have an account? '}
                <button type="button" onClick={() => { setAuthMode(m => m === 'login' ? 'register' : 'login'); setAuthErr(''); }} className="font-semibold text-[#4f6df5]">{authMode === 'login' ? 'Create one' : 'Sign in'}</button>
            </div>
        </>
    );

    const footer = auth ? composer : authPanel;

    return (
        <>
            <button onClick={toggle} className="fixed bottom-3 left-3 z-[2147483647] flex items-center gap-1.5 bg-[#4f6df5] text-white text-[13px] font-semibold px-3.5 py-2 rounded-lg shadow-lg">
                <MessageSquare size={15} /> Feedback
            </button>
            {open && (
                <div className={`fixed top-0 right-0 bottom-0 z-[2147483647] flex flex-col bg-white text-[13px] text-[#111] ${full ? 'left-0 w-screen' : 'w-[420px] max-w-full shadow-[-10px_0_34px_rgba(0,0,0,0.2)]'}`}>
                    <div className="flex-none flex items-center justify-between gap-2.5 px-[18px] py-[15px] bg-[#111827] text-white font-semibold text-[15px]">
                        <span>Leave feedback</span>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={toggleFull} aria-label="Toggle full screen" className="text-white/80 hover:text-white">
                                {full ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </button>
                            <button type="button" onClick={closeDrawer} aria-label="Close" className="text-white/80 hover:text-white text-[22px] leading-none px-0.5">&times;</button>
                        </div>
                    </div>
                    {full ? (
                        <div className="flex-1 flex min-h-0">
                            <div className="flex-1 overflow-auto px-7 py-4 bg-[#f9fafb]">{thread}</div>
                            <div className="w-[440px] max-w-[42%] flex-none overflow-auto border-l border-[#eee] px-5 py-4 bg-white">{footer}</div>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-auto px-4 py-3.5 bg-[#f9fafb]">{thread}</div>
                            <div className="flex-none border-t border-[#eee] px-4 py-3.5 bg-white">{footer}</div>
                        </>
                    )}
                    <style>{`
                        .pf-ed:empty:before{content:attr(data-ph);color:#9ca3af}
                        .pf-ed ul,.pf-body ul{list-style:disc;padding-left:20px;margin:4px 0}
                        .pf-ed ol,.pf-body ol{list-style:decimal;padding-left:20px;margin:4px 0}
                        .pf-body p,.pf-ed p{margin:4px 0}
                        .pf-focus{box-shadow:0 0 0 2px #4f6df5}
                    `}</style>
                </div>
            )}
        </>
    );
}

export default function PublicPage({ page, company }) {
    const isFullHtml = (page.content ?? '').includes('<!DOCTYPE') || (page.content ?? '').includes('<html');
    const iframeRef = useRef();

    useEffect(() => {
        if (isFullHtml && iframeRef.current) {
            const iframe = iframeRef.current;

            // Write content directly into iframe document
            const writeContent = () => {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow?.document;
                    doc.open();
                    doc.write(page.content);
                    doc.close();
                } catch (e) {
                    console.error('iframe write error:', e);
                }
            };

            const resize = () => {
                try {
                    const doc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (doc?.body) {
                        iframe.style.height = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight) + 50 + 'px';
                    }
                } catch (e) {}
            };

            writeContent();

            // Resize after content loads
            iframe.onload = () => {
                resize();
                setTimeout(resize, 300);
                setTimeout(resize, 1000);
                setTimeout(resize, 3000);
            };

            // Also try resizing after a delay in case onload doesn't fire
            setTimeout(resize, 500);
            setTimeout(resize, 2000);

            window.addEventListener('resize', resize);
            return () => window.removeEventListener('resize', resize);
        }
    }, [isFullHtml, page.content]);

    // Full HTML document — render standalone in iframe
    if (isFullHtml) {
        return (
            <>
                <Head title={page.title} />
                <iframe
                    ref={iframeRef}
                    className="w-full border-0 min-h-screen"
                    title={page.title}
                />
            </>
        );
    }

    // Simple content — render with wrapper
    return (
        <>
            <Head title={page.title} />

            <div className="min-h-screen bg-gradient-to-b from-[#f8f9fc] to-[#f0f2f8]">
                <header className="bg-white/80 backdrop-blur-md border-b border-[#e5e7eb]/50 sticky top-0 z-10">
                    <div className="max-w-3xl mx-auto px-6 h-14 flex items-center gap-3">
                        {company?.logo_path && <img src={`/storage/${company.logo_path}`} alt="" className="h-6" />}
                        <span className="text-[13px] font-bold text-black">{company?.name}</span>
                        <span className="text-[12px] text-[#6b7280]">·</span>
                        <span className="text-[12px] text-[#6b7280]">{page.project?.name}</span>
                    </div>
                </header>

                <main className="max-w-3xl mx-auto px-6 py-10">
                    <h1 className="text-[28px] font-extrabold text-black mb-2">{page.title}</h1>
                    <div className="text-[12px] text-[#6b7280] mb-8">
                        {page.creator?.name && <span>By {page.creator.name}</span>}
                        {page.updated_at && <span> · Updated {new Date(page.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>}
                    </div>

                    {page.content && (
                        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-8 shadow-sm">
                            <div className="page-content" dangerouslySetInnerHTML={{ __html: page.content }} />
                        </div>
                    )}
                </main>

                {page.share_code && <FeedbackWidget code={page.share_code} projectId={page.project_id} />}
            </div>

            <style>{`
                .page-content { font-size: 14.5px; line-height: 1.8; color: #333; }
                .page-content h1 { font-size: 1.5em; font-weight: 700; margin: 1.2em 0 0.5em; color: #1a1a1a; }
                .page-content h2 { font-size: 1.25em; font-weight: 700; margin: 1em 0 0.4em; color: #1a1a1a; }
                .page-content h3 { font-size: 1.1em; font-weight: 600; margin: 0.8em 0 0.3em; }
                .page-content p { margin: 0.5em 0; }
                .page-content ul { list-style: disc; padding-left: 1.5em; margin: 0.5em 0; }
                .page-content ol { list-style: decimal; padding-left: 1.5em; margin: 0.5em 0; }
                .page-content li { margin: 0.3em 0; }
                .page-content blockquote { border-left: 3px solid #4f6df5; padding-left: 1em; margin: 1em 0; color: #6b7280; font-style: italic; }
                .page-content hr { border: none; border-top: 1px solid #e5e7eb; margin: 2em 0; }
                .page-content table { border-collapse: collapse; width: 100%; margin: 1em 0; }
                .page-content th { background: #f3f4f6; font-weight: 600; text-align: left; }
                .page-content th, .page-content td { border: 1px solid #d1d5db; padding: 8px 12px; font-size: 13px; }
                .page-content strong { font-weight: 600; }
                .page-content code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
            `}</style>
        </>
    );
}
