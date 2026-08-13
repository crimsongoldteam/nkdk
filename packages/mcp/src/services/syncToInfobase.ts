import { randomUUID } from "node:crypto"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import {
  PlatformSessionError,
  recordPartialSyncDeliveryPhase,
  readProjectSettings,
  type PlatformSessionManager,
} from "@nkdk/platform"
import {
  loadCoreApi,
  type CoreApi,
  type CoreProjectStateService,
} from "../coreApi"
import { toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import type { SyncToInfobaseInput } from "../contracts/syncToInfobase"
import { resolveComponent, type ResolveComponentResult } from "./componentResolver"
import { getPlatformSessionManager } from "./platformSessionHandle"
import { projectSettingsFailure } from "./projectSettingsFailure"
import { projectStateHandle } from "./projectStateHandle"
import { temporaryDirectoryFileSystem } from "./temporaryDirectory"

type PartialCore = Pick<CoreApi,
  | "preparePartialSync"
  | "readPendingPartialSync"
  | "markPartialSyncTransferring"
  | "markPartialSyncPreparedAfterRejection"
  | "markPartialSyncApplied"
  | "finalizePartialSync"
>

type OutputDiagnostic = {
  readonly severity: "error" | "warning"
  readonly code?: string
  readonly message: string
}

export interface SyncToInfobaseDependencies {
  readonly readSettings: typeof readProjectSettings
  readonly resolveComponent: (options: {
    readonly projectDir: string
    readonly componentPath?: string
  }) => ResolveComponentResult
  readonly core: PartialCore
  readonly projectState: CoreProjectStateService
  readonly platformManager: Pick<PlatformSessionManager, "loadPartialConfiguration">
  readonly recordDeliveryPhase: typeof recordPartialSyncDeliveryPhase
  readonly fs: {
    mkdir(path: string): Promise<void>
    rm(path: string): Promise<void>
  }
  readonly attemptId: () => string
}

export type SyncToInfobasePayload = ToolPayload<{
  readonly status: "unchanged" | "synchronized"
  readonly componentPath: string
  readonly diagnostics?: readonly OutputDiagnostic[]
  readonly packageId?: string
  readonly entries?: readonly string[]
  readonly loadTargets?: readonly string[]
  readonly mode?: "designer-agent"
  readonly reusedConnection?: boolean
  readonly finalizeStatus?: "published" | "alreadyPublished"
  readonly configurationIndexPath?: string
  readonly warnings?: readonly OutputDiagnostic[]
}>

const projectSyncQueues = new Map<string, Promise<void>>()

export async function syncToInfobase(
  input: SyncToInfobaseInput,
  providedDependencies?: SyncToInfobaseDependencies,
  signal?: AbortSignal,
): Promise<SyncToInfobasePayload> {
  if (input.allowWrite !== true) {
    return toolError(
      "confirmation_required",
      "sync_to_infobase запускает 1С и изменяет сохранённую конфигурацию; повторите вызов с allowWrite=true",
      { projectDir: input.projectDir, componentPath: input.componentPath ?? "cf" },
    )
  }

  try {
    const dependencies = providedDependencies ?? await defaultDependencies()
    const settingsRead = await dependencies.readSettings(input.projectDir)
    if (settingsRead.status !== "ready") return projectSettingsFailure(settingsRead)!
    return enqueueProjectSync(settingsRead.projectDir, () =>
      syncToInfobaseExclusive(input, dependencies, settingsRead, signal))
  } catch {
    return toolError("core_error", "Не удалось синхронизировать проект с информационной базой")
  }
}

async function syncToInfobaseExclusive(
  input: SyncToInfobaseInput,
  dependencies: SyncToInfobaseDependencies,
  settingsRead: Extract<Awaited<ReturnType<typeof readProjectSettings>>, { status: "ready" }>,
  signal?: AbortSignal,
): Promise<SyncToInfobasePayload> {
  try {
    const requestedComponentPath = input.componentPath ?? "cf"
    if (!isSupportedComponentPath(requestedComponentPath)) {
      return toolError("invalid_arguments", "Ожидался путь cf или cfe/<Имя>", {
        componentPath: requestedComponentPath,
      })
    }
    const component = dependencies.resolveComponent({
      projectDir: settingsRead.projectDir,
      componentPath: requestedComponentPath,
    })
    if (!component.ok) return component.error

    const pending = await dependencies.core.readPendingPartialSync(
      component.projectDir,
      component.componentPath,
    )
    if (pending?.delivery.status === "transferring") {
      return unknownPreviousDelivery(component.projectDir, pending)
    }
    if (pending?.delivery.status === "applied") {
      return await finalizeApplied({
        dependencies,
        projectDir: component.projectDir,
        componentPath: component.componentPath,
        packageId: pending.packageId,
        entries: pending.entries,
        loadTargets: pending.loadTargets,
        attemptId: pending.delivery.attemptId,
      })
    }

    const prepared = await dependencies.core.preparePartialSync({
      context: { defaultLanguage: "ru", version: "2.20" },
      projectDir: component.projectDir,
      componentPath: component.componentPath,
      projectState: dependencies.projectState,
    })
    if (!prepared.ok) {
      return toolError("core_error", "Не удалось подготовить частичную синхронизацию", {
        componentPath: component.componentPath,
        diagnostics: prepared.diagnostics,
      })
    }
    if (prepared.status === "unchanged") {
      return toolSuccess({
        status: "unchanged" as const,
        componentPath: component.componentPath,
        diagnostics: prepared.diagnostics,
      })
    }

    const attemptId = dependencies.attemptId()
    const temporaryDirectory = attemptDirectory(component.projectDir, attemptId)
    const operationLogProjectPath = operationLogPath(attemptId)
    const logPath = join(temporaryDirectory, "platform.log")
    await dependencies.fs.mkdir(temporaryDirectory)
    await dependencies.core.markPartialSyncTransferring({
      projectDir: component.projectDir,
      componentPath: component.componentPath,
      packageId: prepared.packageId,
      attemptId,
      operationLogProjectPath,
    })

    let loaded: Awaited<ReturnType<PlatformSessionManager["loadPartialConfiguration"]>>
    try {
      const { operations: _operations, ...connectionSettings } = settingsRead.settings.infobase
      loaded = await dependencies.platformManager.loadPartialConfiguration({
        projectDir: component.projectDir,
        archivePath: prepared.archivePath,
        loadTargets: prepared.loadTargets,
        logPath,
        ...connectionSettings,
        ...(component.componentPath === "cf"
          ? {}
          : { extensionName: component.componentPath.slice("cfe/".length) }),
        ...(signal === undefined ? {} : { signal }),
      })
    } catch (caught) {
      if (!isUnknownOutcome(caught)) {
        try {
          await dependencies.core.markPartialSyncPreparedAfterRejection({
            projectDir: component.projectDir,
            componentPath: component.componentPath,
            packageId: prepared.packageId,
            attemptId,
          })
        } catch {
          return unknownDelivery(prepared.packageId, component.componentPath, temporaryDirectory, logPath)
        }
        await dependencies.recordDeliveryPhase({ path: logPath, phase: "prepared" }).catch(() => undefined)
      }
      return mapDeliveryFailure(caught, prepared.packageId, component.componentPath, temporaryDirectory)
    }

    try {
      await dependencies.core.markPartialSyncApplied({
        projectDir: component.projectDir,
        componentPath: component.componentPath,
        packageId: prepared.packageId,
        attemptId,
      })
    } catch {
      return unknownDelivery(prepared.packageId, component.componentPath, temporaryDirectory, logPath)
    }
    try {
      await dependencies.recordDeliveryPhase({ path: logPath, phase: "applied" })
    } catch {
      loaded = {
        ...loaded,
        warnings: [...loaded.warnings, "Не удалось записать итоговую фазу в журнал платформы"],
      }
    }

    return await finalizeApplied({
      dependencies,
      projectDir: component.projectDir,
      componentPath: component.componentPath,
      packageId: prepared.packageId,
      entries: prepared.entries,
      loadTargets: prepared.loadTargets,
      attemptId,
      loaded,
      preparationDiagnostics: prepared.diagnostics,
    })
  } catch {
    return toolError("core_error", "Не удалось синхронизировать проект с информационной базой")
  }
}

async function enqueueProjectSync<T>(projectDir: string, operation: () => Promise<T>): Promise<T> {
  const previous = projectSyncQueues.get(projectDir) ?? Promise.resolve()
  const result = previous.then(operation, operation)
  const tail = result.then(() => undefined, () => undefined)
  projectSyncQueues.set(projectDir, tail)
  try {
    return await result
  } finally {
    if (projectSyncQueues.get(projectDir) === tail) projectSyncQueues.delete(projectDir)
  }
}

async function defaultDependencies(): Promise<SyncToInfobaseDependencies> {
  const core = await loadCoreApi()
  return {
    readSettings: readProjectSettings,
    resolveComponent,
    core,
    projectState: await projectStateHandle.get(),
    platformManager: getPlatformSessionManager(),
    recordDeliveryPhase: recordPartialSyncDeliveryPhase,
    fs: temporaryDirectoryFileSystem,
    attemptId: randomUUID,
  }
}

async function finalizeApplied(params: {
  readonly dependencies: SyncToInfobaseDependencies
  readonly projectDir: string
  readonly componentPath: string
  readonly packageId: string
  readonly entries: readonly string[]
  readonly loadTargets: readonly string[]
  readonly attemptId: string
  readonly loaded?: Awaited<ReturnType<PlatformSessionManager["loadPartialConfiguration"]>>
  readonly preparationDiagnostics?: readonly OutputDiagnostic[]
}): Promise<SyncToInfobasePayload> {
  const temporaryDirectory = attemptDirectory(params.projectDir, params.attemptId)
  const logPath = join(temporaryDirectory, "platform.log")
  let finalized: Awaited<ReturnType<CoreApi["finalizePartialSync"]>>
  try {
    finalized = await params.dependencies.core.finalizePartialSync({
      projectDir: params.projectDir,
      componentPath: params.componentPath,
      packageId: params.packageId,
    })
  } catch {
    return toolError("core_error", "Платформа приняла изменения, но снимок проекта не удалось зафиксировать", {
      packageId: params.packageId,
      componentPath: params.componentPath,
      temporaryDirectory,
      stage: "finalize",
      mode: "designer-agent",
      log: logReference(logPath),
    })
  }

  const warnings: OutputDiagnostic[] = [
    ...(params.preparationDiagnostics ?? []).filter((diagnostic) => diagnostic.severity === "warning"),
    ...(params.loaded?.warnings ?? []).map((message) => ({
      severity: "warning" as const,
      code: "platform_cleanup_failed",
      message,
    })),
  ]
  try {
    await params.dependencies.fs.rm(temporaryDirectory)
  } catch {
    warnings.push({
      severity: "warning",
      code: "temporary_directory_cleanup_failed",
      message: "Не удалось удалить каталог успешной попытки синхронизации",
    })
  }
  return toolSuccess({
    status: "synchronized" as const,
    componentPath: params.componentPath,
    packageId: params.packageId,
    entries: params.entries,
    loadTargets: params.loadTargets,
    mode: "designer-agent" as const,
    reusedConnection: params.loaded?.reusedConnection ?? true,
    finalizeStatus: finalized.status,
    configurationIndexPath: finalized.configurationIndexPath,
    warnings,
  })
}

function unknownPreviousDelivery(
  projectDir: string,
  pending: Awaited<ReturnType<CoreApi["readPendingPartialSync"]>> & {},
): SyncToInfobasePayload {
  const delivery = pending.delivery
  if (delivery.status !== "transferring") throw new Error("Ожидалась незавершённая передача")
  const temporaryDirectory = attemptDirectory(projectDir, delivery.attemptId)
  return toolError(
    "delivery_outcome_unknown",
    "Результат предыдущей передачи неизвестен; автоматический повтор запрещён",
    {
      packageId: pending.packageId,
      componentPath: pending.componentPath,
      temporaryDirectory,
      stage: "configuration-load",
      mode: "designer-agent",
      log: logReference(resolve(projectDir, ...delivery.operationLogProjectPath.split("/"))),
    },
  )
}

function mapDeliveryFailure(
  caught: unknown,
  packageId: string,
  componentPath: string,
  temporaryDirectory: string,
): SyncToInfobasePayload {
  if (!(caught instanceof PlatformSessionError)) {
    return toolError("core_error", "Не удалось передать частичную конфигурацию платформе", {
      packageId,
      componentPath,
      temporaryDirectory,
    })
  }
  const details = caught.details
  return toolError(caught.code, caught.message, {
    packageId,
    componentPath,
    temporaryDirectory,
    stage: details?.stage ?? "configuration-load",
    mode: details?.mode ?? "designer-agent",
    ...(details?.logPath === undefined ? {} : { log: logReference(details.logPath) }),
  })
}

function unknownDelivery(
  packageId: string,
  componentPath: string,
  temporaryDirectory: string,
  logPath: string,
): SyncToInfobasePayload {
  return toolError(
    "delivery_outcome_unknown",
    "Платформа могла применить изменения; автоматический повтор запрещён",
    {
      packageId,
      componentPath,
      temporaryDirectory,
      stage: "configuration-load",
      mode: "designer-agent",
      log: logReference(logPath),
    },
  )
}

function isUnknownOutcome(caught: unknown): boolean {
  return caught instanceof PlatformSessionError
    && (caught.code === "delivery_outcome_unknown" || caught.commandOutcome === "unknown")
}

function isSupportedComponentPath(value: string): boolean {
  return value === "cf" || /^cfe\/[^/\\.][^/\\]*$/u.test(value)
}

function attemptDirectory(projectDir: string, attemptId: string): string {
  return join(projectDir, ".nkdk", "tmp", "sync-to-infobase", attemptId)
}

function operationLogPath(attemptId: string): string {
  return [".nkdk", "tmp", "sync-to-infobase", attemptId, "platform.log"].join("/")
}

function logReference(path: string): { readonly uri: string; readonly format: "text/plain" } {
  return { uri: pathToFileURL(path).href, format: "text/plain" }
}
