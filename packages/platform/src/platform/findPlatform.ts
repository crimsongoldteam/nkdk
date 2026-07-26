import { posix, win32 } from "node:path"
import { nodePlatformRuntime, type PlatformArchitecture, type PlatformRuntime } from "../runtime"
import { collectInstallationRoots } from "./roots"

export type PlatformInstallation = {
  version: string
  directory: string
  enterprisePath?: string
  ibcmdPath?: string
}

type Candidate = PlatformInstallation & {
  build: number
  architecture?: PlatformArchitecture
  rootOrder: number
}

const supportedVersion = /^8\.3\.27\.(\d+)$/

async function validApplication(runtime: PlatformRuntime, path: string): Promise<string | undefined> {
  try {
    const stat = await runtime.fs.stat(path)
    if (!stat.isFile) return undefined
    if (runtime.environment.os !== "win32" && (stat.mode & 0o111) === 0) return undefined
    return await runtime.fs.realpath(path)
  } catch {
    return undefined
  }
}

async function firstApplication(
  runtime: PlatformRuntime,
  directory: string,
  relativePaths: string[],
): Promise<string | undefined> {
  const pathApi = runtime.environment.os === "win32" ? win32 : posix
  for (const relativePath of relativePaths) {
    const application = await validApplication(runtime, pathApi.join(directory, relativePath))
    if (application !== undefined) return application
  }
  return undefined
}

export async function findPlatformWithRuntime(
  runtime: PlatformRuntime,
): Promise<PlatformInstallation | undefined> {
  const roots = await collectInstallationRoots(runtime)
  const pathApi = runtime.environment.os === "win32" ? win32 : posix
  const candidates: Candidate[] = []
  for (const root of roots) {
    let names: string[]
    try {
      names = await runtime.fs.readdir(root.path)
    } catch {
      continue
    }
    for (const name of names) {
      const match = supportedVersion.exec(name)
      if (match === null) continue
      const directoryPath = pathApi.join(root.path, name)
      try {
        if (!(await runtime.fs.stat(directoryPath)).isDirectory) continue
      } catch {
        continue
      }
      const enterprisePath = await firstApplication(
        runtime,
        directoryPath,
        runtime.environment.os === "win32" ? ["bin/1cv8.exe"] : ["1cv8", "bin/1cv8"],
      )
      const ibcmdPath = await firstApplication(
        runtime,
        directoryPath,
        runtime.environment.os === "win32" ? ["bin/ibcmd.exe"] : ["ibcmd", "bin/ibcmd"],
      )
      if (enterprisePath === undefined && ibcmdPath === undefined) continue
      candidates.push({
        version: name,
        directory: await runtime.fs.realpath(directoryPath),
        ...(enterprisePath === undefined ? {} : { enterprisePath }),
        ...(ibcmdPath === undefined ? {} : { ibcmdPath }),
        build: Number(match[1]),
        architecture: root.architecture,
        rootOrder: root.order,
      })
    }
  }
  candidates.sort((left, right) => {
    if (left.build !== right.build) return right.build - left.build
    const nativeLeft = left.architecture === runtime.environment.arch ? 1 : 0
    const nativeRight = right.architecture === runtime.environment.arch ? 1 : 0
    if (nativeLeft !== nativeRight) return nativeRight - nativeLeft
    if (left.rootOrder !== right.rootOrder) return left.rootOrder - right.rootOrder
    return left.directory.localeCompare(right.directory)
  })
  const selected = candidates[0]
  if (selected === undefined) return undefined
  const { build: _build, architecture: _architecture, rootOrder: _rootOrder, ...installation } = selected
  return installation
}

export async function findPlatform(): Promise<PlatformInstallation | undefined> {
  return findPlatformWithRuntime(nodePlatformRuntime)
}
