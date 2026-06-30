#!/usr/bin/env node

import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { renderFrontClient } from "../generator/render-front-client.mjs"

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const workspaceRoot = process.cwd()
const [command, target, ...extraArgs] = process.argv.slice(2)

function fail(message) {
  console.error(message)
  console.error("Usage: api-client generate front")
  process.exitCode = 1
}

if (command !== "generate" || target !== "front" || extraArgs.length > 0) {
  fail("Unsupported api-client command.")
} else {
  renderFrontClient({
    packageRoot,
    workspaceRoot,
  }).catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
