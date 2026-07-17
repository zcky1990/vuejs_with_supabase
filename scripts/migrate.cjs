#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Supabase Migration Tool
 *
 * Usage:
 *   pnpm migrate:new <name>        Create a new migration file
 *   pnpm migrate:push              Push migrations to remote (requires supabase link)
 *   pnpm migrate:pull              Pull remote schema (safety backup)
 *   pnpm migrate:list              List local migrations
 *   pnpm migrate:repair <version>  Repair migration history
 *   pnpm migrate:ddl               Convert DDL/ files to supabase migrations
 *
 * Requires Supabase CLI (`pnpm add -D supabase`)
 * Requires `supabase link --project-ref <ref>` done once first
 */

const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const MIGRATIONS_DIR = path.join(ROOT, 'supabase', 'migrations')
const DDL_DIR = path.join(ROOT, 'DDL')

function supabase(args) {
  const cmd = `npx supabase ${args}`
  console.log(`$ ${cmd}`)
  try {
    return execSync(cmd, { cwd: ROOT, stdio: 'inherit' })
  } catch {
    process.exit(1)
  }
}

function ensureMigrationsDir() {
  fs.mkdirSync(MIGRATIONS_DIR, { recursive: true })
}

const cmd = process.argv[2]

switch (cmd) {
  case 'new': {
    const name = process.argv[3]
    if (!name) { console.error('Usage: pnpm migrate:new <name>'); process.exit(1) }
    ensureMigrationsDir()
    supabase(`migration new "${name}"`)
    break
  }

  case 'push': {
    ensureMigrationsDir()
    supabase('db push')
    break
  }

  case 'pull': {
    ensureMigrationsDir()
    supabase('db pull')
    break
  }

  case 'list': {
    ensureMigrationsDir()
    const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort()
    console.log(`\nLocal migrations (${files.length}):\n`)
    for (const f of files) {
      console.log(`  ${f}`)
    }
    break
  }

  case 'repair': {
    const version = process.argv[3]
    if (!version) { console.error('Usage: pnpm migrate:repair <version>'); process.exit(1) }
    supabase(`migration repair ${version} --status applied`)
    break
  }

  case 'ddl': {
    // Convert existing DDL/ files into supabase migration format
    ensureMigrationsDir()
    const files = fs.readdirSync(DDL_DIR).filter(f => f.endsWith('.ddl')).sort()
    if (!files.length) {
      console.log('No DDL files found.')
      break
    }

    const batchTs = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
    let idx = 0

    for (const file of files) {
      const sql = fs.readFileSync(path.join(DDL_DIR, file), 'utf-8')
      const paddedIdx = String(idx).padStart(6, '0')
      const migrationFile = `${batchTs}${paddedIdx}_${file.replace('.ddl', '.sql')}`
      const dest = path.join(MIGRATIONS_DIR, migrationFile)

      if (fs.existsSync(dest)) {
        console.log(`  SKIP (exists): ${migrationFile}`)
      } else {
        fs.writeFileSync(dest, sql)
        console.log(`  CREATED: ${migrationFile}`)
      }
      idx++
    }

    console.log(`\nConverted ${idx} DDL files to supabase/migrations/`)
    console.log('Run pnpm migrate:push to apply them.')
    break
  }

  case 'status': {
    ensureMigrationsDir()
    supabase('migration list')
    break
  }

  default:
    console.log(`
Supabase Migration Tool

  pnpm migrate:new <name>        Create a new migration
  pnpm migrate:push              Push all migrations to database
  pnpm migrate:pull              Pull current schema
  pnpm migrate:list              List local migration files
  pnpm migrate:status            Show remote migration status
  pnpm migrate:repair <version>  Repair migration history
  pnpm migrate:ddl               Convert DDL/*.ddl → supabase/migrations/
`)
}
