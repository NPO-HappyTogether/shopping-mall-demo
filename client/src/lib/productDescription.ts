export function splitDescription(desc: string) {
  const trimmed = desc.trim()
  if (!trimmed) return { summary: '', detail: '' }
  const idx = trimmed.indexOf('\n\n')
  if (idx === -1) return { summary: trimmed, detail: '' }
  return {
    summary: trimmed.slice(0, idx),
    detail: trimmed.slice(idx + 2),
  }
}
