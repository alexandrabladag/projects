// Custom dropdown select — a styled, accessible replacement for native <select>.
// Auto-enables a search box when there are more than `searchThreshold` options.
// The panel renders in a portal with fixed positioning (auto-flips up when there
// isn't room below) so it's never clipped inside scrolling modals / overflow containers.
// Closes on outside-click / Escape / ancestor-scroll; supports keyboard arrows + Enter.
import { useState, useRef, useEffect, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Search, X } from 'lucide-react';

const PANEL_MAX = 300; // approx max panel height (search + list) used for flip decision

export default function Select({
    value,
    onChange,
    options = [],            // [{ value, label, sublabel? }]
    placeholder = 'Select…',
    clearable = false,
    searchThreshold = 8,
    disabled = false,
    className = '',
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const [pos, setPos] = useState(null); // { left, width, top? , bottom?, drop }
    const rootRef = useRef(null);
    const panelRef = useRef(null);
    const searchRef = useRef(null);

    const selected = options.find(o => String(o.value) === String(value)) ?? null;
    const showSearch = options.length > searchThreshold;

    const filtered = useMemo(() => {
        if (!query.trim()) return options;
        const q = query.toLowerCase();
        return options.filter(o =>
            o.label.toLowerCase().includes(q) ||
            (o.sublabel && o.sublabel.toLowerCase().includes(q))
        );
    }, [options, query]);

    // Position the portal panel relative to the trigger; flip up if not enough room below.
    const reposition = () => {
        const el = rootRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const below = window.innerHeight - r.bottom;
        const dropUp = below < PANEL_MAX && r.top > below;
        setPos({
            left: r.left,
            width: r.width,
            drop: dropUp ? 'up' : 'down',
            top: dropUp ? undefined : r.bottom + 6,
            bottom: dropUp ? window.innerHeight - r.top + 6 : undefined,
            maxHeight: Math.max(160, (dropUp ? r.top : below) - 12),
        });
    };

    useLayoutEffect(() => {
        if (!open) return;
        reposition();
        // Reposition on any scroll (capture catches scrolling ancestors) or resize.
        const onScroll = () => reposition();
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll, true);
            window.removeEventListener('resize', onScroll);
        };
    }, [open]);

    // Close on outside click (account for the portalled panel living outside rootRef).
    useEffect(() => {
        if (!open) return;
        const onDoc = (e) => {
            if (rootRef.current?.contains(e.target)) return;
            if (panelRef.current?.contains(e.target)) return;
            setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    // Reset query + focus search when opening.
    useEffect(() => {
        if (open) {
            setQuery('');
            setActive(Math.max(0, filtered.findIndex(o => String(o.value) === String(value))));
            if (showSearch) setTimeout(() => searchRef.current?.focus(), 0);
        }
    }, [open]);

    const pick = (opt) => {
        onChange(opt ? opt.value : '');
        setOpen(false);
    };

    const onKeyDown = (e) => {
        if (!open && (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ')) {
            e.preventDefault(); setOpen(true); return;
        }
        if (!open) return;
        if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
        else if (e.key === 'Enter') { e.preventDefault(); if (filtered[active]) pick(filtered[active]); }
    };

    const triggerCls = 'w-full bg-white border rounded-lg px-3.5 py-2.5 text-[13px] text-left flex items-center justify-between gap-2 outline-none shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-150 ' +
        (disabled ? 'opacity-60 cursor-not-allowed border-[#e5e7eb]' : 'cursor-pointer ' + (open ? 'border-[#4f6df5] ring-[3px] ring-[#4f6df5]/12' : 'border-[#e5e7eb] hover:border-[#d1d5db]'));

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setOpen(o => !o)}
                onKeyDown={onKeyDown}
                className={triggerCls}
            >
                <span className={`truncate ${selected ? 'text-black' : 'text-[#6b7280]'}`}>
                    {selected ? selected.label : placeholder}
                </span>
                <span className="flex items-center gap-1 flex-shrink-0">
                    {clearable && selected && !disabled && (
                        <span
                            role="button"
                            tabIndex={-1}
                            onClick={(e) => { e.stopPropagation(); pick(null); }}
                            className="text-[#6b7280] hover:text-[#4b5563] p-0.5"
                        >
                            <X size={13} />
                        </span>
                    )}
                    <ChevronDown size={15} className={`text-[#6b7280] transition-transform ${open ? 'rotate-180' : ''}`} />
                </span>
            </button>

            {open && pos && createPortal(
                <div
                    ref={panelRef}
                    style={{
                        position: 'fixed',
                        left: pos.left,
                        width: pos.width,
                        top: pos.top,
                        bottom: pos.bottom,
                    }}
                    className={`z-[70] bg-white border border-[#e5e7eb] rounded-xl shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18),0_2px_6px_rgba(16,24,40,0.06)] overflow-hidden ${pos.drop === 'up' ? 'origin-bottom' : 'origin-top'} animate-[selectIn_120ms_ease-out]`}
                >
                    {showSearch && (
                        <div className="p-2 border-b border-[#f0f0f0]">
                            <div className="relative">
                                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6b7280]" />
                                <input
                                    ref={searchRef}
                                    value={query}
                                    onChange={e => { setQuery(e.target.value); setActive(0); }}
                                    onKeyDown={onKeyDown}
                                    placeholder="Search…"
                                    className="w-full bg-[#f3f4f6] rounded-lg pl-8 pr-3 py-2 text-[13px] outline-none focus:bg-[#eef0f3]"
                                />
                            </div>
                        </div>
                    )}
                    <div className="overflow-y-auto py-1" style={{ maxHeight: pos.maxHeight }}>
                        {filtered.length === 0 && (
                            <div className="px-3.5 py-3 text-[13px] text-[#6b7280] text-center">No matches</div>
                        )}
                        {filtered.map((opt, i) => {
                            const isSel = String(opt.value) === String(value);
                            return (
                                <button
                                    type="button"
                                    key={opt.value}
                                    onClick={() => pick(opt)}
                                    onMouseEnter={() => setActive(i)}
                                    className={`w-full text-left px-3.5 py-2 flex items-center justify-between gap-2 text-[13px] transition-colors ${i === active ? 'bg-indigo-50' : ''}`}
                                >
                                    <span className="min-w-0">
                                        <span className={`block truncate ${isSel ? 'text-[#4f6df5] font-medium' : 'text-black'}`}>{opt.label}</span>
                                        {opt.sublabel && <span className="block truncate text-[11px] text-[#6b7280]">{opt.sublabel}</span>}
                                    </span>
                                    {isSel && <Check size={15} className="text-[#4f6df5] flex-shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
