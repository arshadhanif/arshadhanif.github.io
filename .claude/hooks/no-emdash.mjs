// PreToolUse hook: block any Edit/Write/MultiEdit whose new content contains
// an em-dash (—, U+2014) or en-dash (–, U+2013). The user forbids them.
import { readFileSync } from 'node:fs'

let input
try { input = JSON.parse(readFileSync(0, 'utf8')) } catch { process.exit(0) }
const ti = input.tool_input || {}
let text = ''
if (typeof ti.new_string === 'string') text += ti.new_string
if (typeof ti.content === 'string') text += ti.content
if (Array.isArray(ti.edits)) for (const e of ti.edits) text += (e?.new_string || '')

if (/[—–]/.test(text)) {
  console.error('BLOCKED: this edit contains an em-dash (—) or en-dash (–). '
    + 'This project forbids them. Replace with a comma, colon, parentheses, a '
    + 'period, or a plain hyphen for compound words, then retry.')
  process.exit(2) // exit code 2 = block the tool call
}
process.exit(0)
