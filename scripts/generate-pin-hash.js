// Run: node scripts/generate-pin-hash.js <your-pin>
// Then set the output as PIN_HASH in your Vercel environment variables.
import bcrypt from 'bcryptjs'

const pin = process.argv[2]
if (!pin) {
  console.error('Usage: node scripts/generate-pin-hash.js <your-pin>')
  process.exit(1)
}

const hash = await bcrypt.hash(String(pin), 10)
console.log('\nAdd this to your Vercel environment variables:')
console.log(`\nPIN_HASH=${hash}\n`)
