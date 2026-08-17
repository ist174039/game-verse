import { promises as fs } from 'node:fs'
import path from 'node:path'

const roots = [
  'lib/domain',
  'lib/application',
  'lib/infrastructure/repositories/supabase',
]

const forbidden = [
  { pattern: /@\/lib\/types(?:['"]|\/)/g, reason: 'new domain must not depend on legacy lib/types' },
  { pattern: /GameCoin|GameCoins|reward_gc|amount_gc|cost_gc/g, reason: 'legacy GameCoin vocabulary is forbidden in the new domain' },
  { pattern: /window\.alert\(|\balert\(|window\.confirm\(|\bconfirm\(/g, reason: 'native browser alerts/confirms are forbidden' },
]

const files = []
async function walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) await walk(full)
    else if (/\.(ts|tsx|js|mjs)$/.test(entry.name)) files.push(full)
  }
}

for (const root of roots) await walk(root)

const violations = []
for (const file of files) {
  const source = await fs.readFile(file, 'utf8')
  for (const rule of forbidden) {
    rule.pattern.lastIndex = 0
    if (rule.pattern.test(source)) violations.push(`${file}: ${rule.reason}`)
  }
}

if (violations.length) {
  console.error('Domain boundary violations:')
  for (const violation of violations) console.error(`- ${violation}`)
  process.exit(1)
}

console.log(`Domain boundaries OK (${files.length} files checked)`)
