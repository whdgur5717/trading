#!/usr/bin/env node

import { spawnSync } from "node:child_process"
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs"
import { dirname } from "node:path"

const config = {
  region: "ap-northeast-2",
  parameterPath: "/trading/prod/back",
  containerName: "trading-back",
  envFilePath: "/opt/trading/back/.env",
  imageUri: readFileSync(
    new URL("./image-uri.txt", import.meta.url),
    "utf8"
  ).trim(),
  imagePattern:
    /^\d{12}\.dkr\.ecr\.ap-northeast-2\.amazonaws\.com\/trading-back@sha256:[a-f0-9]{64}$/,
}

if (!config.imagePattern.test(config.imageUri)) {
  throw new Error("image-uri.txt must contain trading-back ECR digest URI")
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    input: options.input,
    timeout: options.timeoutMs ?? 60000,
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0 && !options.allowFailure) {
    throw new Error(
      `${command} ${args.join(" ")} failed\n${result.stderr || result.stdout}`
    )
  }

  return result.stdout
}

function writeEnvFile() {
  const response = run("aws", [
    "ssm",
    "get-parameters-by-path",
    "--path",
    config.parameterPath,
    "--with-decryption",
    "--recursive",
    "--region",
    config.region,
    "--output",
    "json",
  ])
  const parameters = JSON.parse(response).Parameters || []
  const env = new Map()

  for (const parameter of parameters) {
    const key = parameter.Name.split("/").at(-1)
    const value = parameter.Value

    if (!key || value.includes("\n")) {
      throw new Error(`Invalid Parameter Store value: ${parameter.Name}`)
    }

    env.set(key, value)
  }

  if (
    existsSync(config.envFilePath) &&
    lstatSync(config.envFilePath).isSymbolicLink()
  ) {
    throw new Error(`${config.envFilePath} must not be a symlink`)
  }

  const tempPath = `${config.envFilePath}.${process.pid}.tmp`

  mkdirSync(dirname(config.envFilePath), { recursive: true })
  writeFileSync(
    tempPath,
    [...env.entries()].map(([key, value]) => `${key}=${value}`).join("\n") +
      "\n",
    { mode: 0o600 }
  )
  renameSync(tempPath, config.envFilePath)
  chmodSync(config.envFilePath, 0o600)

  return env
}

function blockContainerMetadataAccess() {
  const rule = ["DOCKER-USER", "-d", "169.254.169.254/32", "-j", "DROP"]
  const check = spawnSync("iptables", ["-C", ...rule], {
    encoding: "utf8",
    timeout: 10000,
  })

  if (check.status !== 0) {
    run("iptables", ["-I", ...rule], { timeoutMs: 10000 })
  }
}

const registry = config.imageUri.split("/")[0]
const password = run("aws", [
  "ecr",
  "get-login-password",
  "--region",
  config.region,
])

run("docker", ["login", "--username", "AWS", "--password-stdin", registry], {
  input: password,
})

const env = writeEnvFile()
const port = env.get("PORT")

if (!port) {
  throw new Error("PORT is required in Parameter Store")
}

blockContainerMetadataAccess()

run("docker", ["pull", config.imageUri], { timeoutMs: 300000 })
run("docker", ["logout", registry], { allowFailure: true, timeoutMs: 10000 })
run("docker", ["rm", "-f", config.containerName], { allowFailure: true })
run("docker", [
  "run",
  "-d",
  "--pull",
  "never",
  "--init",
  "--restart",
  "unless-stopped",
  "--name",
  config.containerName,
  "--security-opt",
  "no-new-privileges",
  "--cap-drop",
  "ALL",
  "--env-file",
  config.envFilePath,
  "-p",
  `127.0.0.1:${port}:${port}`,
  config.imageUri,
])

await new Promise((resolve) => setTimeout(resolve, 3000))

const running = run("docker", [
  "inspect",
  "-f",
  "{{.State.Running}}",
  config.containerName,
]).trim()

if (running !== "true") {
  throw new Error(
    `${config.containerName} stopped immediately after docker run`
  )
}

console.log(`Deployed ${config.containerName}: ${config.imageUri}`)
