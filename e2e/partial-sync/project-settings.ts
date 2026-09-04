import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import type { PlatformMode } from "./concurrency"

export async function writeProjectSettings(
  projectDir: string,
  baseDir: string,
  mode: PlatformMode,
): Promise<void> {
  const settingsDir = join(projectDir, ".nkdk")
  await mkdir(settingsDir, { recursive: true })
  await writeFile(join(settingsDir, "project.yaml"), [
    "infobase:",
    `  connectionString: 'File="${baseDir.replaceAll("'", "''")}";'`,
    "  operations:",
    "    import:",
    `      mode: ${mode}`,
    "",
  ].join("\n"), { encoding: "utf8", mode: 0o600 })
}
