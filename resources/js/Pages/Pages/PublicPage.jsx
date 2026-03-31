import { useRef, useEffect } from 'react';
import { Head } from '@inertiajs/react';

export default function PublicPage({ page, company }) {
    const isFullHtml = (page.content ?? '').includes('<!DOCTYPE') || (page.content ?? '').includes('<html');
    const iframeRef = useRef();

    useEffect(() => {
        if (isFullHtml && iframeRef.current) {
            const doc = iframeRef.current.contentDocument;
            doc.open();
            doc.write(page.content);
            doc.close();

            // Auto-resize iframe to content height
            const resize = () => {
                if (iframeRef.current && doc.body) {
                    iframeRef.current.style.height = doc.body.scrollHeight + 'px';
                }
            };
            setTimeout(resize, 100);
            setTimeout(resize, 500);
            setTimeout(resize, 1500);
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
                    sandbox="allow-same-origin allow-scripts"
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
                        <span className="text-[12px] text-[#9ca3af]">·</span>
                        <span className="text-[12px] text-[#9ca3af]">{page.project?.name}</span>
                    </div>
                </header>

                <main className="max-w-3xl mx-auto px-6 py-10">
                    <h1 className="text-[28px] font-extrabold text-black mb-2">{page.title}</h1>
                    <div className="text-[12px] text-[#9ca3af] mb-8">
                        {page.creator?.name && <span>By {page.creator.name}</span>}
                        {page.updated_at && <span> · Updated {new Date(page.updated_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>}
                    </div>

                    {page.content && (
                        <div className="bg-white rounded-2xl border border-[#e5e7eb] p-8 shadow-sm">
                            <div className="page-content" dangerouslySetInnerHTML={{ __html: page.content }} />
                        </div>
                    )}
                </main>
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
