import React, { useEffect } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Sparkles,
  Search,
  Lightbulb,
  Bookmark,
  Check,
  Undo,
  Redo,
} from 'lucide-react';

interface TipTapEditorProps {
  content: string;
  onChange: (text: string, wordCount: number) => void;
  onInlineAction: (actionType: 'FIX_GRAMMAR' | 'UPGRADE_SENTENCE' | 'COLLOCATION', selectedText: string) => void;
  onSaveToNotebook: (selectedText: string) => void;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  content,
  onChange,
  onInlineAction,
  onSaveToNotebook,
}) => {
  const calculateWords = (text: string) => {
    const clean = text.replace(/<[^>]*>/g, ' ').replace(/[#*_`]/g, '');
    const matches = clean.match(/\b[a-zA-Z0-9'-]+\b/g);
    return matches ? matches.length : 0;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder:
          'Bắt đầu viết bài luận của bạn tại đây...\nChia đoạn rõ ràng: Introduction, Body 1, Body 2, Conclusion.',
      }),
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class:
          'min-h-[380px] p-4 text-base leading-relaxed text-zinc-800 outline-none font-sans focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const words = calculateWords(text);
      onChange(text, words);
    },
  });

  // Sync content if changed from outside (e.g. initial load)
  useEffect(() => {
    if (editor && content !== editor.getText() && !editor.isFocused) {
      editor.commands.setContent(content ? `<p>${content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>` : '');
    }
  }, [content, editor]);

  if (!editor) return null;

  const getSelectedText = () => {
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, ' ');
  };

  return (
    <div className="relative border-2 border-retro-border rounded-xl bg-white overflow-hidden shadow-inner">
      {/* Top formatting mini toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-50 border-b border-retro-border text-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-zinc-200 transition-colors ${
              editor.isActive('bold') ? 'bg-retro-navy text-white' : 'text-zinc-700'
            }`}
            title="In đậm (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-zinc-200 transition-colors ${
              editor.isActive('italic') ? 'bg-retro-navy text-white' : 'text-zinc-700'
            }`}
            title="In nghiêng (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <span className="text-zinc-300 mx-1">|</span>
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded hover:bg-zinc-200 text-zinc-600 disabled:opacity-30"
            title="Hoàn tác"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded hover:bg-zinc-200 text-zinc-600 disabled:opacity-30"
            title="Làm lại"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>

        <span className="text-[11px] text-zinc-400 font-medium italic">
          TipTap Rich Editor
        </span>
      </div>

      {/* TipTap Floating Bubble Menu - Bright Amber-Orange */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{ duration: 150, placement: 'top' }}
        className="flex items-center gap-1 bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 border-2 border-slate-950 rounded-xl shadow-neo-lg p-1.5 text-xs font-black animate-in fade-in zoom-in-95"
      >
        <button
          type="button"
          onClick={() => {
            const selected = getSelectedText();
            if (selected) onInlineAction('FIX_GRAMMAR', selected);
          }}
          className="px-2.5 py-1 hover:bg-black/15 text-slate-950 rounded-lg flex items-center gap-1.5 transition-colors font-black"
        >
          <Search className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Sửa lỗi</span>
        </button>

        <span className="text-slate-950/40">|</span>

        <button
          type="button"
          onClick={() => {
            const selected = getSelectedText();
            if (selected) onInlineAction('UPGRADE_SENTENCE', selected);
          }}
          className="px-2.5 py-1 hover:bg-black/15 text-slate-950 rounded-lg flex items-center gap-1.5 transition-colors font-black"
        >
          <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Nâng cấp</span>
        </button>

        <span className="text-slate-950/40">|</span>

        <button
          type="button"
          onClick={() => {
            const selected = getSelectedText();
            if (selected) onInlineAction('COLLOCATION', selected);
          }}
          className="px-2.5 py-1 hover:bg-black/15 text-slate-950 rounded-lg flex items-center gap-1.5 transition-colors font-black"
        >
          <Lightbulb className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Collocation</span>
        </button>

        <span className="text-slate-950/40">|</span>

        <button
          type="button"
          onClick={() => {
            const selected = getSelectedText();
            if (selected) onSaveToNotebook(selected);
          }}
          className="px-2.5 py-1 bg-slate-900 text-amber-300 rounded-lg hover:bg-slate-800 flex items-center gap-1.5 transition-colors font-black shadow-xs"
        >
          <Bookmark className="w-3.5 h-3.5 fill-current" />
          <span>Lưu Sổ Tay</span>
        </button>
      </BubbleMenu>

      {/* Editor Content Area */}
      <EditorContent editor={editor} />
    </div>
  );
};

