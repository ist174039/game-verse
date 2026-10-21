import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const apiRoot = path.join(process.cwd(), 'app/api')
const authPatterns = [
  /\bauth\.getUser\s*\(/,
  /\bgetAdminSession\s*\(/,
  /\bgetAdminIdentity\s*\(/,
]

// These routes deliberately do not use a user session. Keep their protocol
// specific authentication checks explicit and narrow.
const protocolControls = new Map([
  ['internal/admin/bootstrap:POST', /safeSecretMatch\s*\([^)]*\)[\s\S]*ADMIN_BOOTSTRAP_SECRET|ADMIN_BOOTSTRAP_SECRET[\s\S]*safeSecretMatch\s*\(/],
  ['internal/maintenance:GET', /authorized\s*\(request\)[\s\S]*timingSafeEqual|timingSafeEqual[\s\S]*authorized\s*\(request\)/],
  ['internal/maintenance:POST', /authorized\s*\(request\)[\s\S]*timingSafeEqual|timingSafeEqual[\s\S]*authorized\s*\(request\)/],
  ['stripe/webhook:POST', /stripe-signature[\s\S]*constructEvent|constructEvent[\s\S]*stripe-signature/],
])

async function collectRoutes(directory, relative = '') {
  const routes = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const childRelative = path.join(relative, entry.name)
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) routes.push(...await collectRoutes(fullPath, childRelative))
    else if (entry.isFile() && entry.name === 'route.ts') routes.push({ fullPath, relative: childRelative })
  }
  return routes
}

const failures = []
let handlersChecked = 0

for (const route of await collectRoutes(apiRoot)) {
  const source = await readFile(route.fullPath, 'utf8')
  const methods = [...source.matchAll(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS)\s*\(/g)]
  const routePath = route.relative.split(path.sep).slice(0, -1).join('/')

  if (methods.length === 0) {
    failures.push(`${routePath}: route.ts has no recognized exported HTTP handler`)
    continue
  }

  for (const match of methods) {
    const method = match[1]
    const key = `${routePath}:${method}`
    const protocolControl = protocolControls.get(key)
    const hasAuthentication = authPatterns.some(pattern => pattern.test(source))
    handlersChecked += 1

    if (protocolControl ? !protocolControl.test(source) : !hasAuthentication) {
      failures.push(`${method} /api/${routePath}: missing an explicit authentication boundary or reviewed protocol-specific control`)
    }
  }
}

if (failures.length > 0) {
  console.error('API authentication boundary check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`API authentication boundaries present (${handlersChecked} handlers checked)`)
console.log('This static check does not prove object-level authorization, RLS, or correct guard ordering.')
