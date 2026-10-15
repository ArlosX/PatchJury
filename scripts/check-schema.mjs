#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'

const source = readFileSync(resolve(process.argv[2] || 'contracts/patchjury.py'), 'utf8')
const endpoint = process.env.GENLAYER_RPC_URL || 'https://studio.genlayer.com/api'
const client = createClient({ chain: studionet, endpoint })

try {
  const schema = await client.getContractSchemaForCode(source)
  const methods = Object.keys(schema?.methods || {})
  if (!schema?.ctor || !methods.includes('register_case') || !methods.includes('review_case')) {
    throw new Error('PatchJury schema is incomplete')
  }
  console.log(`PatchJury schema ready: ${methods.length} methods (${methods.join(', ')})`)
} catch (error) {
  console.error(error)
  process.exitCode = 1
}
