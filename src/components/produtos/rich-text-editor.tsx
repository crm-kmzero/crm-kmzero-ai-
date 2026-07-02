import { useRef, useEffect, useCallback } from 'react'
import { Bold, Italic, Underline, List, ListOrdered, Eraser } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('script, iframe, object, embed, link, meta').forEach((el) => el.remove())
  doc.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith('on')) el.removeAttribute(attr.name)
      if (attr.name === 'href' && attr.value.trim().toLowerCase().startsWith('javascript:'))
        el.removeAttribute(attr.name)
    })
  })
  return doc.body.innerHTML
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || ''
    }
  }, [value])

  const exec = useCallback(
    (command: string) => {
      document.execCommand(command, false)
      if (ref.current) onChange(sanitizeHtml(ref.current.innerHTML))
    },
    [onChange],
  )

  const tools = [
    { icon: Bold, cmd: 'bold', label: 'Negrito' },
    { icon: Italic, cmd: 'italic', label: 'Itálico' },
    { icon: Underline, cmd: 'underline', label: 'Sublinhado' },
    { icon: List, cmd: 'insertUnorderedList', label: 'Lista' },
    { icon: ListOrdered, cmd: 'insertOrderedList', label: 'Lista numerada' },
    { icon: Eraser, cmd: 'removeFormat', label: 'Limpar formatação' },
  ]

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="flex items-center gap-1 p-2 border-b bg-slate-50">
        {tools.map((tool) => (
          <Button
            key={tool.cmd}
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => exec(tool.cmd)}
            title={tool.label}
          >
            <tool.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange(sanitizeHtml((e.target as HTMLDivElement).innerHTML))}
        className={cn(
          'min-h-[180px] max-h-[300px] overflow-y-auto p-3 text-sm focus:outline-none',
          'prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4',
        )}
        data-placeholder={placeholder}
      />
    </div>
  )
}
