import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"

export function resolveNodePackageBinary(packageName, fromUrl, binaryName = packageName) {
  const packageJsonPath = createRequire(fromUrl).resolve(`${packageName}/package.json`)
  const manifest = JSON.parse(readFileSync(packageJsonPath, "utf8"))
  const relativeBinaryPath = typeof manifest.bin === "string" ? manifest.bin : manifest.bin?.[binaryName]
  if (typeof relativeBinaryPath !== "string" || relativeBinaryPath.length === 0) {
    throw new Error(`Пакет ${packageName} не содержит bin ${binaryName}`)
  }
  return resolve(dirname(packageJsonPath), relativeBinaryPath)
}
