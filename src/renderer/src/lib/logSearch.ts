export type SearchMode = 'text' | 'regex'

export interface SearchState {
  term: string
  mode: SearchMode
  caseSensitive: boolean
}

export const DEFAULT_SEARCH: SearchState = { term: '', mode: 'text', caseSensitive: false }

export function isSearchActive(search: SearchState): boolean {
  return search.term.length > 0
}

function escapeRegExp(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export interface CompiledSearch {
  regex: RegExp | null
  error: string | null
}

// Builds a single global RegExp used for both matching and highlighting. In
// regex mode an invalid pattern reports an error but never throws, so a
// user mid-edit of a pattern doesn't blank the log view.
export function compileSearch(search: SearchState): CompiledSearch {
  if (!search.term) return { regex: null, error: null }
  const flags = search.caseSensitive ? 'g' : 'gi'
  const source = search.mode === 'regex' ? search.term : escapeRegExp(search.term)
  try {
    return { regex: new RegExp(source, flags), error: null }
  } catch (e) {
    return { regex: null, error: e instanceof Error ? e.message : 'Invalid regex' }
  }
}

export function matchesSearch(raw: string, compiled: CompiledSearch): boolean {
  if (!compiled.regex) return true
  compiled.regex.lastIndex = 0
  return compiled.regex.test(raw)
}

export interface HighlightSegment {
  text: string
  matched: boolean
}

export function highlightSegments(raw: string, compiled: CompiledSearch): HighlightSegment[] {
  if (!compiled.regex) return [{ text: raw, matched: false }]
  const regex = compiled.regex
  regex.lastIndex = 0
  const segments: HighlightSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(raw)) !== null) {
    if (match.index > lastIndex) segments.push({ text: raw.slice(lastIndex, match.index), matched: false })
    if (match[0].length === 0) {
      regex.lastIndex++
      continue
    }
    segments.push({ text: match[0], matched: true })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < raw.length) segments.push({ text: raw.slice(lastIndex), matched: false })

  return segments.length > 0 ? segments : [{ text: raw, matched: false }]
}
