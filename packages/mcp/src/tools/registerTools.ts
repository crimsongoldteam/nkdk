import type { McpServer } from "@modelcontextprotocol/server"
import { jsonToolResult, toolError } from "../contracts/common"
import {
  backgroundOperationLookupOutputSchema,
  backgroundOperationStartOutputSchema,
  cancelOperationInputSchema,
  getOperationInputSchema,
} from "../contracts/backgroundOperations"
import { backgroundOperationHandle, type BackgroundOperationHandle } from "../backgroundOperationHandle"
import { describeProjectStructureInputShape, describeProjectStructureOutputShape } from "../contracts/describeProjectStructure"
import { getSchemaInputShape, getSchemaOutputShape } from "../contracts/getSchema"
import { importFromXmlInputShape, importFromXmlOutputShape } from "../contracts/importFromXml"
import {
  importFromInfobaseInputShape,
  importFromInfobaseOutputShape,
  type ImportFromInfobaseOutput,
} from "../contracts/importFromInfobase"
import {
  syncToInfobaseInputSchema,
  syncToInfobaseOutputShape,
  type SyncToInfobaseOutput,
} from "../contracts/syncToInfobase"
import { initSyncStateInputShape, initSyncStateOutputShape } from "../contracts/initSyncState"
import { listInfobasesInputShape, listInfobasesOutputShape } from "../contracts/listInfobases"
import {
  listInfobaseExtensionsInputSchema,
  listInfobaseExtensionsOutputShape,
} from "../contracts/listInfobaseExtensions"
import { findReferencesInputShape, metadataOperationOutputSchema, renameItemInputShape } from "../contracts/operations"
import { syncToXmlInputShape, syncToXmlOutputShape } from "../contracts/syncToXml"
import { validateProjectInputShape, validateProjectOutputShape } from "../contracts/validateProject"
import { projectCacheInputSchema, rebuildProjectCacheOutputSchema, resetProjectCacheOutputSchema } from "../contracts/projectCache"
import type { ToolPayload } from "../contracts/common"
import {
  closeAllPlatformConnectionsInputShape,
  closeAllPlatformConnectionsOutputShape,
  closePlatformConnectionInputShape,
  closePlatformConnectionOutputShape,
} from "../contracts/platformConnections"
import { toMcpSchema } from "../contracts/mcpSchema"
import { guideDefinitions } from "../guides"
import { promptDefinitions } from "../prompts"
import { registerProjectSettingsSchemaResource } from "../resources/projectSettingsSchema"
import { describeProjectStructure } from "../services/describeProjectStructure"
import { getSchema } from "../services/getSchema"
import { importFromXml } from "../services/importFromXml"
import { importFromInfobase } from "../services/importFromInfobase"
import { syncToInfobase } from "../services/syncToInfobase"
import { initSyncState } from "../services/initSyncState"
import { listInfobasesService } from "../services/listInfobases"
import { listInfobaseExtensions } from "../services/listInfobaseExtensions"
import { findReferences } from "../services/findReferences"
import { renameItem } from "../services/renameItem"
import { syncToXml } from "../services/syncToXml"
import { validateYamlProject } from "../services/validateProject"
import { rebuildProjectCache, resetProjectCache } from "../services/projectCache"
import {
  closeAllPlatformConnections,
  closePlatformConnection,
} from "../services/platformConnections"

type RegisterableServer = Pick<McpServer, "registerTool" | "registerResource" | "registerPrompt">

const mcpSchemas = {
  getSchemaInput: toMcpSchema(getSchemaInputShape),
  getSchemaOutput: toMcpSchema(getSchemaOutputShape),
  describeProjectStructureInput: toMcpSchema(describeProjectStructureInputShape),
  describeProjectStructureOutput: toMcpSchema(describeProjectStructureOutputShape),
  listInfobasesInput: toMcpSchema(listInfobasesInputShape),
  listInfobasesOutput: toMcpSchema(listInfobasesOutputShape),
  listInfobaseExtensionsInput: toMcpSchema(listInfobaseExtensionsInputSchema),
  listInfobaseExtensionsOutput: toMcpSchema(listInfobaseExtensionsOutputShape),
  validateProjectInput: toMcpSchema(validateProjectInputShape),
  validateProjectOutput: toMcpSchema(validateProjectOutputShape),
  projectCacheInput: toMcpSchema(projectCacheInputSchema),
  resetProjectCacheOutput: toMcpSchema(resetProjectCacheOutputSchema),
  rebuildProjectCacheOutput: toMcpSchema(rebuildProjectCacheOutputSchema),
  importFromXmlInput: toMcpSchema(importFromXmlInputShape),
  importFromXmlOutput: toMcpSchema(importFromXmlOutputShape),
  importFromInfobaseInput: toMcpSchema(importFromInfobaseInputShape),
  importFromInfobaseOutput: toMcpSchema(importFromInfobaseOutputShape),
  syncToInfobaseInput: toMcpSchema(syncToInfobaseInputSchema),
  syncToInfobaseOutput: toMcpSchema(syncToInfobaseOutputShape),
  closePlatformConnectionInput: toMcpSchema(closePlatformConnectionInputShape),
  closePlatformConnectionOutput: toMcpSchema(closePlatformConnectionOutputShape),
  closeAllPlatformConnectionsInput: toMcpSchema(closeAllPlatformConnectionsInputShape),
  closeAllPlatformConnectionsOutput: toMcpSchema(closeAllPlatformConnectionsOutputShape),
  syncToXmlInput: toMcpSchema(syncToXmlInputShape),
  syncToXmlOutput: toMcpSchema(syncToXmlOutputShape),
  initSyncStateInput: toMcpSchema(initSyncStateInputShape),
  initSyncStateOutput: toMcpSchema(initSyncStateOutputShape),
  renameItemInput: toMcpSchema(renameItemInputShape),
  metadataOperationOutput: toMcpSchema(metadataOperationOutputSchema),
  findReferencesInput: toMcpSchema(findReferencesInputShape),
  backgroundOperationStartOutput: toMcpSchema(backgroundOperationStartOutputSchema),
  backgroundOperationLookupOutput: toMcpSchema(backgroundOperationLookupOutputSchema),
  getOperationInput: toMcpSchema(getOperationInputSchema),
  cancelOperationInput: toMcpSchema(cancelOperationInputSchema),
} as const

export interface RegisterNkdkDependencies {
  readonly backgroundOperations: BackgroundOperationHandle
}

const defaultRegisterDependencies: RegisterNkdkDependencies = {
  backgroundOperations: backgroundOperationHandle,
}

export function registerNkdkCapabilities(
  server: RegisterableServer,
  dependencies: RegisterNkdkDependencies = defaultRegisterDependencies,
): void {
  registerProjectSettingsSchemaResource(server)

  server.registerTool(
    "nkdk.get_schema",
    {
      title: "Get NKDK YAML schema",
      description:
        "Возвращает JSON Schema или краткую JSON-сводку: по metadataRef или по structurePath внутри компонента NKDK-проекта. projectDir - корень проекта, componentPath по умолчанию cf.",
      inputSchema: mcpSchemas.getSchemaInput,
      outputSchema: mcpSchemas.getSchemaOutput,
    },
    async (input) => jsonToolResult(await getSchema(input))
  )

  server.registerTool(
    "nkdk.describe_project_structure",
    {
      title: "Describe NKDK project structure",
      description:
        "Возвращает допустимые файлы и подкаталоги для structurePath внутри компонента NKDK-проекта. projectDir - корень проекта, componentPath по умолчанию cf.",
      inputSchema: mcpSchemas.describeProjectStructureInput,
      outputSchema: mcpSchemas.describeProjectStructureOutput,
    },
    async (input) => jsonToolResult(await describeProjectStructure(input))
  )

  server.registerTool(
    "nkdk.list_infobases",
    {
      title: "List 1C infobases",
      description:
        "Возвращает дерево баз из личного и общих списков 1С вместе с источниками и предупреждениями. Не изменяет файлы.",
      inputSchema: mcpSchemas.listInfobasesInput,
      outputSchema: mcpSchemas.listInfobasesOutput,
    },
    async () => jsonToolResult(await listInfobasesService())
  )

  server.registerTool(
    "nkdk.list_infobase_extensions",
    {
      title: "List 1C infobase extensions",
      description:
        "Возвращает свойства расширений информационной базы по настройкам .nkdk/project.yaml. Поддерживает соединение через агент 1С и offline-режим ibcmd. Не изменяет базу и файлы проекта.",
      inputSchema: mcpSchemas.listInfobaseExtensionsInput,
      outputSchema: mcpSchemas.listInfobaseExtensionsOutput,
    },
    createListInfobaseExtensionsHandler()
  )

  server.registerTool(
    "nkdk.validate_project",
    {
      title: "Validate NKDK YAML project",
      description: "В фоне проверяет все компоненты в корне NKDK-проекта и сразу возвращает operationId. Итог доступен через nkdk.get_operation.",
      inputSchema: mcpSchemas.validateProjectInput,
      outputSchema: mcpSchemas.backgroundOperationStartOutput,
    },
    async (input) => jsonToolResult(await (await dependencies.backgroundOperations.get()).start("validate_project", input))
  )

  server.registerTool(
    "nkdk.reset_project_cache",
    {
      title: "Reset NKDK project cache",
      description:
        "Закрывает состояние проекта и удаляет только .nkdk/cache/project-state.bin. Не запускает validation и не изменяет configuration-index. Требует allowWrite=true.",
      inputSchema: mcpSchemas.projectCacheInput,
      outputSchema: mcpSchemas.resetProjectCacheOutput,
    },
    async (input) => jsonToolResult(await resetProjectCache(input))
  )

  server.registerTool(
    "nkdk.rebuild_project_cache",
    {
      title: "Rebuild NKDK project cache",
      description:
        "В фоне строит отдельное полное состояние проекта, выполняет validation и атомарно заменяет cache даже при обычных diagnostics. Сразу возвращает operationId; итог доступен через nkdk.get_operation. Требует allowWrite=true.",
      inputSchema: mcpSchemas.projectCacheInput,
      outputSchema: mcpSchemas.backgroundOperationStartOutput,
    },
    async (input) => jsonToolResult(await (await dependencies.backgroundOperations.get()).start("rebuild_project_cache", input))
  )

  server.registerTool(
    "nkdk.import_from_xml",
    {
      title: "Import 1C XML to NKDK YAML",
      description:
        "В фоне импортирует готовую XML-выгрузку одного компонента из xmlDir в projectDir и сразу возвращает operationId; итог доступен через nkdk.get_operation. Для расширения путь определяется из Configuration.xml, componentPath передавать не требуется; при передаче он служит ограничением, цель должна отсутствовать или быть пустой. Операция не подключается к 1С и не импортирует все компоненты за один вызов. Пишет файлы только при allowWrite=true.",
      inputSchema: mcpSchemas.importFromXmlInput,
      outputSchema: mcpSchemas.backgroundOperationStartOutput,
    },
    async (input) => {
      if (input.allowWrite !== true) return jsonToolResult(toolError(
        "confirmation_required",
        "import_from_xml пишет YAML-файлы; повторите вызов с allowWrite=true",
      ))
      return jsonToolResult(await (await dependencies.backgroundOperations.get()).start("import_from_xml", input))
    }
  )

  server.registerTool(
    "nkdk.import_from_infobase",
    {
      title: "Import 1C infobase to NKDK YAML",
      description:
        "В фоне импортирует один компонент информационной базы и сразу возвращает operationId; итог доступен через nkdk.get_operation. Выбирает по умолчанию cf, расширение — через cfe/<Имя>; цель должна отсутствовать или быть пустой. Перед расширением cf импортируется первым. Перед операцией нужно создать .nkdk/project.yaml по опубликованной схеме, вручную внести нужные пароли, а затем повторить импорт. Запускает 1С и пишет файлы только при allowWrite=true.",
      inputSchema: mcpSchemas.importFromInfobaseInput,
      outputSchema: mcpSchemas.backgroundOperationStartOutput,
    },
    async (input) => {
      if (input.allowWrite !== true) return jsonToolResult(toolError(
        "confirmation_required",
        "import_from_infobase запускает 1С и пишет YAML-файлы; повторите вызов с allowWrite=true",
      ))
      return jsonToolResult(await (await dependencies.backgroundOperations.get()).start("import_from_infobase", input))
    }
  )

  server.registerTool(
    "nkdk.sync_to_infobase",
    {
      title: "Partially sync NKDK YAML to 1C infobase",
      description:
        "В фоне частично загружает изменения одного компонента cf или cfe/<Имя> в сохранённую конфигурацию информационной базы и сразу возвращает operationId; итог доступен через nkdk.get_operation. Поддерживает агентный и автономный режимы и обновляет конфигурацию базы данных. Запускает платформу и изменяет конфигурацию только при allowWrite=true.",
      inputSchema: mcpSchemas.syncToInfobaseInput,
      outputSchema: mcpSchemas.backgroundOperationStartOutput,
    },
    async (input) => {
      if (input.allowWrite !== true) return jsonToolResult(toolError(
        "confirmation_required",
        "sync_to_infobase запускает 1С и изменяет сохранённую конфигурацию; повторите вызов с allowWrite=true",
      ))
      return jsonToolResult(await (await dependencies.backgroundOperations.get()).start("sync_to_infobase", input))
    }
  )

  server.registerTool(
    "nkdk.close_platform_connection",
    {
      title: "Close project platform connection",
      description:
        "Закрывает сохранённое соединение проекта с платформой; завершает только процесс 1С, запущенный текущим MCP-процессом.",
      inputSchema: mcpSchemas.closePlatformConnectionInput,
      outputSchema: mcpSchemas.closePlatformConnectionOutput,
    },
    async (input) => jsonToolResult(await closePlatformConnection(input))
  )

  server.registerTool(
    "nkdk.close_all_platform_connections",
    {
      title: "Close all platform connections",
      description:
        "Закрывает все сохранённые соединения с платформой; завершает только процессы 1С, запущенные текущим MCP-процессом.",
      inputSchema: mcpSchemas.closeAllPlatformConnectionsInput,
      outputSchema: mcpSchemas.closeAllPlatformConnectionsOutput,
    },
    async () => jsonToolResult(await closeAllPlatformConnections())
  )

  server.registerTool(
    "nkdk.sync_to_xml",
    {
      title: "Sync NKDK YAML to 1C XML",
      description:
        "В фоне выгружает один YAML-компонент projectDir/componentPath в заданный xmlDir через файл индекса конфигурации и сразу возвращает operationId; итог доступен через nkdk.get_operation. componentPath по умолчанию cf; xmlDir не вычисляется как xmlRootDir/componentPath. Проверки выполняются всегда; ignoreValidationErrors только разрешает продолжение при diagnostics. Файлы пишутся только при allowWrite=true.",
      inputSchema: mcpSchemas.syncToXmlInput,
      outputSchema: mcpSchemas.backgroundOperationStartOutput,
    },
    async (input) => jsonToolResult(await (await dependencies.backgroundOperations.get()).start("sync_to_xml", input))
  )

  server.registerTool(
    "nkdk.get_operation",
    {
      title: "Get NKDK background operation",
      description: "Возвращает сохранённое состояние и итог длительной операции по projectDir и operationId.",
      inputSchema: mcpSchemas.getOperationInput,
      outputSchema: mcpSchemas.backgroundOperationLookupOutput,
    },
    async (input) => {
      const snapshot = await (await dependencies.backgroundOperations.get()).get(input.projectDir, input.operationId)
      return jsonToolResult(snapshot ?? toolError("not_found", `Операция не найдена: ${input.operationId}`))
    }
  )

  server.registerTool(
    "nkdk.cancel_operation",
    {
      title: "Cancel NKDK background operation",
      description: "Запрашивает отмену длительной операции и возвращает её сохранённое состояние.",
      inputSchema: mcpSchemas.cancelOperationInput,
      outputSchema: mcpSchemas.backgroundOperationLookupOutput,
    },
    async (input) => {
      const snapshot = await (await dependencies.backgroundOperations.get()).cancel(input.projectDir, input.operationId)
      return jsonToolResult(snapshot ?? toolError("not_found", `Операция не найдена: ${input.operationId}`))
    }
  )

  server.registerTool(
    "nkdk.init_sync_state",
    {
      title: "Initialize NKDK XML sync state",
      description:
        "Создаёт .nkdk-sync.yaml для выбранного YAML-компонента projectDir/componentPath. componentPath по умолчанию cf. Пишет файл только при allowWrite=true.",
      inputSchema: mcpSchemas.initSyncStateInput,
      outputSchema: mcpSchemas.initSyncStateOutput,
    },
    async (input) => jsonToolResult(await initSyncState(input))
  )

  server.registerTool(
    "nkdk.rename_item",
    {
      title: "Rename NKDK metadata item",
      description:
        "Единственный MCP-способ сохранить XML/reference identity при переименовании metadataRef в выбранном компоненте projectDir/componentPath. Проверки выполняются всегда; ignoreValidationErrors только разрешает продолжение при diagnostics.",
      inputSchema: mcpSchemas.renameItemInput,
      outputSchema: mcpSchemas.metadataOperationOutput,
    },
    async (input) => metadataToolResult(await renameItem(input), "Переименование")
  )

  server.registerTool(
    "nkdk.find_references",
    {
      title: "Find NKDK metadata references",
      description:
        "Ищет внешние ссылки на metadataRef в выбранном компоненте projectDir/componentPath. componentPath по умолчанию cf. Проверки выполняются всегда; ignoreValidationErrors только разрешает продолжение при diagnostics. Файлы не изменяет.",
      inputSchema: mcpSchemas.findReferencesInput,
      outputSchema: mcpSchemas.metadataOperationOutput,
    },
    async (input) => metadataToolResult(await findReferences(input), "Поиск ссылок")
  )

  for (const guide of guideDefinitions) {
    server.registerResource(
      guide.name,
      guide.uri,
      {
        title: guide.name,
        description: guide.description,
        mimeType: "text/markdown",
      },
      (uri) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: guide.text,
          },
        ],
      })
    )
  }

  for (const prompt of promptDefinitions) {
    server.registerPrompt(
      prompt.name,
      {
        title: prompt.title,
        description: prompt.description,
      },
      () => ({
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: prompt.text,
            },
          },
        ],
      })
    )
  }
}

export function metadataToolResult(payload: ToolPayload, operation: string) {
  profileStructuredContent(payload)
  const summary = payload["summary"]
  const report = payload["report"]
  if (
    typeof summary === "object"
    && summary !== null
    && "errors" in summary
    && "warnings" in summary
    && "shown" in summary
    && "omitted" in summary
  ) {
    return jsonToolResult(payload, {
      text: `${operation}: ошибок ${summary.errors}, предупреждений ${summary.warnings}; показано ${summary.shown}, скрыто ${summary.omitted}.`,
      ...(isDiagnosticReport(report) ? {
        resource: {
          uri: report.uri,
          name: "Полный отчёт diagnostics",
          mimeType: report.format,
        },
      } : {}),
    })
  }
  return jsonToolResult(payload)
}

function profileStructuredContent(payload: ToolPayload): void {
  if (process.env["NKDK_PROFILE"] !== "1") return
  const startedAt = performance.now()
  const bytes = Buffer.byteLength(JSON.stringify(payload))
  const timeMs = performance.now() - startedAt
  console.error([
    "[nkdk-profile-step]",
    `operation=${JSON.stringify("mcp")}`,
    `step=${JSON.stringify("Выдача результата MCP")}`,
    `substep=${JSON.stringify("Формирование structuredContent MCP")}`,
    "scope=main",
    "items=1",
    `bytes=${bytes}`,
    `time=${timeMs.toFixed(2)}ms`,
  ].join(" "))
}

function isDiagnosticReport(value: unknown): value is { uri: string; format: "application/x-ndjson" } {
  return typeof value === "object"
    && value !== null
    && "uri" in value
    && typeof value.uri === "string"
    && "format" in value
    && value.format === "application/x-ndjson"
}

export function createImportFromInfobaseHandler(
  service: typeof importFromInfobase = importFromInfobase
) {
  return async (
    input: Parameters<typeof importFromInfobase>[0],
    context: { mcpReq: { signal: AbortSignal } }
  ) => importFromInfobaseToolResult(
    await service(input, undefined, context.mcpReq.signal) as ImportFromInfobaseOutput
  )
}

export function importFromInfobaseToolResult(payload: ImportFromInfobaseOutput) {
  return infobaseToolResult(payload, "Журнал импорта из информационной базы")
}

export function createSyncToInfobaseHandler(
  service: typeof syncToInfobase = syncToInfobase
) {
  return async (
    input: Parameters<typeof syncToInfobase>[0],
    context: { mcpReq: { signal: AbortSignal } }
  ) => syncToInfobaseToolResult(
    await service(input, undefined, context.mcpReq.signal) as SyncToInfobaseOutput
  )
}

export function syncToInfobaseToolResult(payload: SyncToInfobaseOutput) {
  return infobaseToolResult(payload, "Журнал синхронизации с информационной базой")
}

function infobaseToolResult(payload: ToolPayload, logName: string) {
  if (payload.ok) return jsonToolResult(payload)
  const details = payload.details
  const reference = isRecord(details) && isResourceReference(details["schema"])
    ? {
        uri: details["schema"].uri,
        name: "Схема настроек проекта",
        mimeType: details["schema"].format,
      }
    : isRecord(details) && isResourceReference(details["log"])
      ? {
          uri: details["log"].uri,
          name: logName,
          mimeType: details["log"].format,
        }
      : undefined
  return jsonToolResult(payload, {
    text: payload.message,
    ...(reference === undefined ? {} : { resource: reference }),
  })
}

function isResourceReference(value: unknown): value is { uri: string; format: string } {
  return isRecord(value)
    && typeof value["uri"] === "string"
    && typeof value["format"] === "string"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function createListInfobaseExtensionsHandler(
  service: typeof listInfobaseExtensions = listInfobaseExtensions
) {
  return async (
    input: Parameters<typeof listInfobaseExtensions>[0],
    context: { mcpReq: { signal: AbortSignal } }
  ) => jsonToolResult(await service(input, undefined, context.mcpReq.signal))
}
