#!/usr/bin/env node

import { spawnSync } from "node:child_process"
import {
  appendFileSync,
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

function requireEnv(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}

const config = {
  region: requireEnv("AWS_REGION"),
  bucket: requireEnv("CODEDEPLOY_ARTIFACT_BUCKET"),
  applicationName: requireEnv("CODEDEPLOY_APPLICATION_NAME"),
  deploymentGroupName: requireEnv("CODEDEPLOY_DEPLOYMENT_GROUP_NAME"),
  artifactKey: requireEnv("CODEDEPLOY_ARTIFACT_KEY"),
  imageUri: requireEnv("BACK_IMAGE_URI"),
  waitSeconds: Number(requireEnv("CODEDEPLOY_WAIT_SECONDS")),
  imagePattern:
    /^\d{12}\.dkr\.ecr\.ap-northeast-2\.amazonaws\.com\/trading-back@sha256:[a-f0-9]{64}$/,
}

if (!config.imagePattern.test(config.imageUri)) {
  throw new Error("BACK_IMAGE_URI must be a trading-back ECR digest URI")
}

if (!Number.isFinite(config.waitSeconds) || config.waitSeconds <= 0) {
  throw new Error("CODEDEPLOY_WAIT_SECONDS must be a positive number")
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout: options.timeoutMs,
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed\n${result.stderr || result.stdout}`
    )
  }

  const stdout = result.stdout.trim()

  if (stdout && !options.silent) {
    console.log(stdout)
  }

  return stdout
}

function createRevisionSource() {
  const revisionDir = mkdtempSync(join(tmpdir(), "trading-codedeploy-"))
  const codedeployDir = join(revisionDir, "deploy", "codedeploy")

  mkdirSync(codedeployDir, { recursive: true })
  copyFileSync("appspec.yml", join(revisionDir, "appspec.yml"))
  copyFileSync(
    "deploy/codedeploy/deploy.mjs",
    join(codedeployDir, "deploy.mjs")
  )
  writeFileSync(join(codedeployDir, "image-uri.txt"), `${config.imageUri}\n`, {
    mode: 0o600,
  })

  return revisionDir
}

const revisionDir = createRevisionSource()

try {
  run("aws", [
    "deploy",
    "push",
    "--application-name",
    config.applicationName,
    "--s3-location",
    `s3://${config.bucket}/${config.artifactKey}`,
    "--source",
    revisionDir,
    "--ignore-hidden-files",
    "--region",
    config.region,
  ])

  const deploymentId = run(
    "aws",
    [
      "deploy",
      "create-deployment",
      "--application-name",
      config.applicationName,
      "--deployment-group-name",
      config.deploymentGroupName,
      "--s3-location",
      `bucket=${config.bucket},key=${config.artifactKey},bundleType=zip`,
      "--file-exists-behavior",
      "OVERWRITE",
      "--auto-rollback-configuration",
      "enabled=true,events=DEPLOYMENT_FAILURE",
      "--region",
      config.region,
      "--query",
      "deploymentId",
      "--output",
      "text",
    ],
    { silent: true }
  )

  if (!deploymentId || deploymentId === "None") {
    throw new Error("CodeDeploy did not return deploymentId")
  }

  console.log(`CodeDeploy deployment started: ${deploymentId}`)

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `deployment_id=${deploymentId}\n`)
  }

  run(
    "aws",
    [
      "deploy",
      "wait",
      "deployment-successful",
      "--deployment-id",
      deploymentId,
      "--region",
      config.region,
    ],
    {
      timeoutMs: config.waitSeconds * 1000,
    }
  )
} finally {
  rmSync(revisionDir, { recursive: true, force: true })
}

console.log("CodeDeploy deployment succeeded")
