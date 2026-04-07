import { useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Placeholder from '@tiptap/extension-placeholder';
import axios from 'axios';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    Heading1, Heading2, Heading3, List, ListOrdered, Quote,
    Table as TableIcon, AlignLeft, AlignCenter, AlignRight,
    Undo, Redo, Minus, Pilcrow, PenLine, Code,
    ImageIcon, Paperclip,
} from 'lucide-react';

function ToolbarBtn({ onClick, active, disabled, children, title }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`p-1.5 rounded transition-all ${
                active
                    ? 'bg-[#4f6df5]/15 text-[#4f6df5]'
                    : 'text-[#6b7280] hover:text-black hover:bg-gray-100'
            } disabled:opacity-30`}
        >
            {children}
        </button>
    );
}

function Divider() {
    return <div className="w-px h-5 bg-[#e5e7eb] mx-0.5" />;
}

export default function RichEditor({ content, onChange, placeholder = 'Start writing…', projectId }) {
    const [showSource, setShowSource] = useState(false);
    const [htmlSource, setHtmlSource] = useState('');
    const [uploading, setUploading] = useState(false);
    const imageInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Image.configure({ inline: false, allowBase64: false }),
            Table.configure({ resizable: false }),
            TableRow,
            TableCell,
            TableHeader,
            Placeholder.configure({ placeholder }),
        ],
        content: content || '',
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none min-h-[300px] px-4 py-3 outline-none text-[13.5px] text-black leading-relaxed',
            },
        },
    });

    if (!editor) return null;

    const uploadFile = async (file, insertAs) => {
        if (!projectId || !file) return;
        setUploading(true);
        try {
            const form = new FormData();
            form.append('file', file);
            const { data } = await axios.post(`/projects/${projectId}/documents/editor-upload`, form);
            if (insertAs === 'image' && data.isImage) {
                editor.chain().focus().setImage({ src: data.url, alt: data.name }).run();
            } else {
                editor.chain().focus().insertContent(
                    `<p>📎 <a href="${data.download}" target="_blank"><strong>${data.name}</strong></a></p>`
                ).run();
            }
        } catch (e) {
            console.error('Upload failed', e);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="border border-[#d1d5db] rounded-xl bg-white focus-within:border-[#4f6df5] transition-colors">
            {/* Toolbar — sticky within modal scroll */}
            <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-[#e5e7eb] bg-[#fafafa] sticky top-0 z-20 rounded-t-xl">
                <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
                    <Bold size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
                    <Italic size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
                    <UnderlineIcon size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
                    <Strikethrough size={15} />
                </ToolbarBtn>

                <Divider />

                <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
                    <Heading1 size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
                    <Heading2 size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
                    <Heading3 size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} title="Paragraph">
                    <Pilcrow size={15} />
                </ToolbarBtn>

                <Divider />

                <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
                    <List size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
                    <ListOrdered size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
                    <Quote size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
                    <Minus size={15} />
                </ToolbarBtn>

                <Divider />

                <ToolbarBtn
                    onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    title="Insert Table"
                >
                    <TableIcon size={15} />
                </ToolbarBtn>

                {editor.isActive('table') && (
                    <>
                        <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="px-1.5 py-1 text-[10px] text-[#6b7280] hover:text-black hover:bg-gray-100 rounded transition-all" title="Add Column">+Col</button>
                        <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="px-1.5 py-1 text-[10px] text-[#6b7280] hover:text-black hover:bg-gray-100 rounded transition-all" title="Add Row">+Row</button>
                        <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} className="px-1.5 py-1 text-[10px] text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Delete Column">-Col</button>
                        <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} className="px-1.5 py-1 text-[10px] text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Delete Row">-Row</button>
                        <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="px-1.5 py-1 text-[10px] text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Delete Table">Del Table</button>
                    </>
                )}

                <Divider />

                <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align Left">
                    <AlignLeft size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align Center">
                    <AlignCenter size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align Right">
                    <AlignRight size={15} />
                </ToolbarBtn>

                <Divider />

                <ToolbarBtn
                    onClick={() => {
                        editor.chain().focus().insertContent(`
                            <hr />
                            <h2>Approval & Agreement</h2>
                            <p>This proposal constitutes a formal service agreement upon signature.</p>
                            <table>
                                <tr><th>Prepared By</th><th>Approved By</th></tr>
                                <tr>
                                    <td><br/><br/><strong>____________________________</strong><br/>Name / Title<br/>Company</td>
                                    <td><br/><br/><strong>____________________________</strong><br/>Name / Title<br/>Company</td>
                                </tr>
                            </table>
                        `).run();
                    }}
                    title="Insert Signature Block"
                >
                    <PenLine size={15} />
                </ToolbarBtn>

                {projectId && (
                    <>
                        <Divider />
                        <ToolbarBtn onClick={() => imageInputRef.current?.click()} title="Insert Image" disabled={uploading}>
                            <ImageIcon size={15} />
                        </ToolbarBtn>
                        <ToolbarBtn onClick={() => fileInputRef.current?.click()} title="Attach File" disabled={uploading}>
                            <Paperclip size={15} />
                        </ToolbarBtn>
                        <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={e => { uploadFile(e.target.files[0], 'image'); e.target.value = ''; }} />
                        <input ref={fileInputRef} type="file" className="hidden" onChange={e => { uploadFile(e.target.files[0], 'file'); e.target.value = ''; }} />
                        {uploading && <span className="text-[10px] text-[#9ca3af] ml-1">Uploading...</span>}
                    </>
                )}

                <div className="flex-1" />

                <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
                    <Undo size={15} />
                </ToolbarBtn>
                <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
                    <Redo size={15} />
                </ToolbarBtn>

                <Divider />

                <ToolbarBtn
                    onClick={() => {
                        if (showSource) {
                            // Apply HTML back to editor
                            editor.commands.setContent(htmlSource);
                            onChange(htmlSource);
                            setShowSource(false);
                        } else {
                            setHtmlSource(editor.getHTML());
                            setShowSource(true);
                        }
                    }}
                    active={showSource}
                    title="HTML Source Code"
                >
                    <Code size={15} />
                </ToolbarBtn>
            </div>

            {/* Visual Editor */}
            {!showSource && <EditorContent editor={editor} />}

            {/* HTML Source Editor */}
            {showSource && (
                <textarea
                    value={htmlSource}
                    onChange={e => setHtmlSource(e.target.value)}
                    className="w-full min-h-[300px] px-4 py-3 font-mono text-[12px] text-black bg-[#fafbfc] outline-none resize-y leading-relaxed"
                    spellCheck={false}
                    placeholder="<h1>Your HTML here...</h1>"
                />
            )}

            {/* Styles for the editor content */}
            <style>{`
                .ProseMirror { min-height: 300px; }
                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #9ca3af;
                    pointer-events: none;
                    height: 0;
                }
                .ProseMirror h1 { font-size: 1.5em; font-weight: 700; margin: 1em 0 0.5em; color: #2d5f8a; border-bottom: 2px solid #2d5f8a; padding-bottom: 0.3em; }
                .ProseMirror h2 { font-size: 1.25em; font-weight: 700; margin: 1em 0 0.4em; color: #2d5f8a; }
                .ProseMirror h3 { font-size: 1.1em; font-weight: 600; margin: 0.8em 0 0.3em; color: #374151; }
                .ProseMirror p { margin: 0.4em 0; }
                .ProseMirror ul { list-style: disc; padding-left: 1.5em; margin: 0.4em 0; }
                .ProseMirror ol { list-style: decimal; padding-left: 1.5em; margin: 0.4em 0; }
                .ProseMirror li { margin: 0.2em 0; }
                .ProseMirror blockquote { border-left: 3px solid #4f6df5; padding-left: 1em; margin: 0.8em 0; color: #6b7280; font-style: italic; }
                .ProseMirror hr { border: none; border-top: 1px solid #e5e7eb; margin: 1.5em 0; }
                .ProseMirror table { border-collapse: collapse; width: 100%; margin: 1em 0; }
                .ProseMirror th { background: #f3f4f6; font-weight: 600; text-align: left; }
                .ProseMirror th, .ProseMirror td { border: 1px solid #d1d5db; padding: 8px 12px; font-size: 13px; }
                .ProseMirror .selectedCell { background: #4f6df5/10; }
                .ProseMirror img { max-width: 100%; height: auto; border-radius: 8px; margin: 0.8em 0; }
                .ProseMirror a { color: #4f6df5; text-decoration: underline; }
            `}</style>
        </div>
    );
}
