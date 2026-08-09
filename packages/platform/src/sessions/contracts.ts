import type { PlatformInstallation } from "../platform/findPlatform"
import type { PlatformOperationLog } from "./operationLog"
import type { CreatePlatformSessionParams, PlatformSession } from "./types"

export interface PlatformSessionManagerDependencies {
  canonicalizeProjectDir(projectDir: string): Promise<string>
  findPlatform(): Promise<PlatformInstallation | undefined>
  createDesignerSession(params: CreatePlatformSessionParams): Promise<PlatformSession>
  createStandaloneSession(params: CreatePlatformSessionParams): Promise<PlatformSession>
  setTimer(callback: () => void, timeoutMs: number): unknown
  clearTimer(timer: unknown): void
  createOperationLog(params: { path: string; secrets: readonly string[] }): Promise<PlatformOperationLog>
}
