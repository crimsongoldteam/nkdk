import { posix, win32 } from "node:path"
import type { PlatformArchitecture, PlatformRuntime } from "../runtime"
import { readStartupConfiguration, type StartupConfigKind } from "../startupConfig"

export type InstallationRoot = {
  path: string
  source: StartupConfigKind | "standard"
  architecture?: PlatformArchitecture
  order: number
}

export async function collectInstallationRoots(runtime: PlatformRuntime): Promise<InstallationRoot[]> {
  const config = await readStartupConfiguration(runtime)
  const priority: StartupConfigKind[] = ["common-config", "all-users-config", "user-config"]
  const configured = priority.flatMap((kind) =>
    config.files
      .filter((file) => file.kind === kind)
      .flatMap((file) => file.entries.filter(({ key }) => key === "installedlocation"))
      .map(({ value }) => ({ path: value, source: kind })),
  )
  const roots = [...configured, ...standardRoots(runtime)]
  const pathApi = runtime.environment.os === "win32" ? win32 : posix
  const seen = new Set<string>()
  return roots.flatMap((root) => {
    const path = pathApi.normalize(root.path)
    const key = runtime.environment.os === "win32" ? path.toLowerCase() : path
    if (seen.has(key) || path === ".") return []
    seen.add(key)
    return [{ ...root, path, order: seen.size - 1 }]
  })
}

function standardRoots(runtime: PlatformRuntime): Array<Omit<InstallationRoot, "order">> {
  const { os, env } = runtime.environment
  if (os === "linux") {
    return [
      { path: "/opt/1cv8/x86_64", source: "standard", architecture: "x64" },
      { path: "/opt/1cv8/i386", source: "standard", architecture: "x86" },
      { path: "/opt/1cv8/arm64", source: "standard", architecture: "arm64" },
    ]
  }
  if (os === "darwin") return [{ path: "/opt/1cv8", source: "standard" }]
  return [
    ...(env.ProgramFiles ? [{ path: win32.join(env.ProgramFiles, "1cv8"), source: "standard" as const }] : []),
    ...(env["ProgramFiles(x86)"]
      ? [{ path: win32.join(env["ProgramFiles(x86)"], "1cv8"), source: "standard" as const, architecture: "x86" as const }]
      : []),
    ...(env.LOCALAPPDATA
      ? [
          { path: win32.join(env.LOCALAPPDATA, "Programs", "1cv8"), source: "standard" as const },
          { path: win32.join(env.LOCALAPPDATA, "Programs", "1cv8_x86"), source: "standard" as const, architecture: "x86" as const },
          { path: win32.join(env.LOCALAPPDATA, "Programs", "1cv8_x64"), source: "standard" as const, architecture: "x64" as const },
        ]
      : []),
  ]
}
