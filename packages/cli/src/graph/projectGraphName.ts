import { createHash } from "crypto"
import { resolve } from "path"

export function projectGraphName(projectPath: string): string {
  const absoluteProjectPath = resolve(projectPath)
  const hash = createHash("sha1").update(absoluteProjectPath).digest("hex").slice(0, 12)
  return `nkdk_${hash}`
}
