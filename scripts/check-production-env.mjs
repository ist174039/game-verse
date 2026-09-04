const errors = []
const warnings = []

const value = (name) => process.env[name]?.trim() ?? ''
const isPlaceholder = (input) =>
  !input || /(?:your-project|example\.com|replace-with|_xxx|generate-a-)/i.test(input)

function requireValue(name) {
  const current = value(name)
  if (isPlaceholder(current)) errors.push(`${name} is missing or still uses a template value`)
  return current
}

function requireSecret(name, minimum = 32) {
  const current = requireValue(name)
  if (current && current.length < minimum) {
    errors.push(`${name} must contain at least ${minimum} characters`)
  }
  return current
}

const supabaseUrl = requireValue('NEXT_PUBLIC_SUPABASE_URL')
if (supabaseUrl) {
  try {
    const parsed = new URL(supabaseUrl)
    if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co')) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL must be an HTTPS *.supabase.co URL')
    }
  } catch {
    errors.push('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
  }
}

requireValue('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
if (!value('SUPABASE_SECRET_KEY') && !value('SUPABASE_SERVICE_ROLE_KEY')) {
  errors.push('SUPABASE_SECRET_KEY (or legacy SUPABASE_SERVICE_ROLE_KEY) is required')
}

requireSecret('CRON_SECRET')
requireSecret('INTERNAL_JOBS_SECRET')

const stripeNames = [
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
]
const configuredStripeValues = stripeNames.filter((name) => value(name))
if (configuredStripeValues.length > 0 && configuredStripeValues.length < stripeNames.length) {
  errors.push(`Stripe configuration is incomplete; set all of: ${stripeNames.join(', ')}`)
} else if (configuredStripeValues.length === 0) {
  warnings.push('Stripe is disabled; Gold checkout will not be available')
} else {
  for (const name of stripeNames) requireValue(name)
}

if (value('ADMIN_BOOTSTRAP_PASSWORD') || value('ADMIN_BOOTSTRAP_SECRET')) {
  warnings.push('administrator bootstrap credentials are present; remove them after bootstrap')
}

for (const warning of warnings) console.warn(`WARN: ${warning}`)
for (const error of errors) console.error(`ERROR: ${error}`)

if (errors.length > 0) {
  console.error(`Production environment gate failed with ${errors.length} error(s).`)
  process.exit(1)
}

console.log('Production environment gate passed.')
