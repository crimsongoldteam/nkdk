import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { jsonToolResult } from "../contracts/common"
import { describeProjectStructureInputShape } from "../contracts/describeProjectStructure"
import { getSchemaInputShape } from "../contracts/getSchema"
import { importFromXmlInputShape } from "../contracts/importFromXml"
import { importFromInfobaseInputShape } from "../contracts/importFromInfobase"
import { initSyncStateInputShape } from "../contracts/initSyncState"
import { listInfobasesInputShape } from "../contracts/listInfobases"
import { findReferencesInputShape, renameItemInputShape } from "../contracts/operations"
import { syncToXmlInputShape } from "../contracts/syncToXml"
import { validateProjectInputShape } from "../contracts/validateProject"
import {
  closeAllPlatformConnectionsInputShape,
  closePlatformConnectionInputShape,
} from "../contracts/platformConnections"
import { guideDefinitions } from "../guides"
import { promptDefinitions } from "../prompts"
import { describeProjectStructure } from "../services/describeProjectStructure"
import { getSchema } from "../services/getSchema"
import { importFromXml } from "../services/importFromXml"
import { importFromInfobase } from "../services/importFromInfobase"
import { initSyncState } from "../services/initSyncState"
import { listInfobasesService } from "../services/listInfobases"
import { findReferences } from "../services/findReferences"
import { renameItem } from "../services/renameItem"
import { syncToXml } from "../services/syncToXml"
import { validateYamlProject } from "../services/validateProject"
import {
  closeAllPlatformConnections,
  closePlatformConnection,
} from "../services/platformConnections"

type RegisterableServer = Pick<McpServer, "registerTool" | "registerResource" | "registerPrompt">

export function registerNkdkCapabilities(server: RegisterableServer): void {
  server.registerTool(
    "nkdk.get_schema",
    {
      title: "Get NKDK YAML schema",
      description:
        "Возвращает JSON Schema или краткую JSON-сводку: по metadataRef или по structurePath внутри компонента NKDK-проекта. projectDir - корень проекта, componentPath по умолчанию cf.",
      inputSchema: getSchemaInputShape,
    },
    async (input) => jsonToolResult(await getSchema(input))
  )

  server.registerTool(
    "nkdk.describe_project_structure",
    {
      title: "Describe NKDK project structure",
      description:
        "Возвращает допустимые файлы и подкаталоги для structurePath внутри компонента NKDK-проекта. projectDir - корень проекта, componentPath по умолчанию cf.",
      inputSchema: describeProjectStructureInputShape,
    },
    async (input) => jsonToolResult(await describeProjectStructure(input))
  )

  server.registerTool(
    "nkdk.list_infobases",
    {
      title: "List 1C infobases",
      description:
        "Возвращает дерево баз из личного и общих списков 1С вместе с источниками и предупреждениями. Не изменяет файлы.",
      inputSchema: listInfobasesInputShape,
    },
    async () => jsonToolResult(await listInfobasesService())
  )

  server.registerTool(
    "nkdk.validate_project",
    {
      title: "Validate NKDK YAML project",
      description: "Проверяет компонент cf в корне NKDK-проекта и возвращает diagnostics в JSON.",
      inputSchema: validateProjectInputShape,
    },
    async (input) => jsonToolResult(await validateYamlProject(input))
  )

  server.registerTool(
    "nkdk.import_from_xml",
    {
      title: "Import 1C XML to NKDK YAML",
      description:
        "Импортирует готовую XML-выгрузку одного компонента из xmlDir в projectDir/componentPath. componentPath по умолчанию cf; цель должна отсутствовать или быть пустой. Операция не подключается к 1С и не импортирует все компоненты за один вызов. Пишет файлы только при allowWrite=true.",
      inputSchema: importFromXmlInputShape,
    },
    async (input) => jsonToolResult(await importFromXml(input))
  )

  server.registerTool(
    "nkdk.import_from_infobase",
    {
      title: "Import 1C infobase to NKDK YAML",
      description:
        "Запускает 1С и импортирует основную конфигурацию базы только в отсутствующий или пустой cf проекта. Агент и offline-режим ibcmd поддерживают File и Srvr/Ref; для offline Srvr/Ref нужны параметры СУБД. Пишет файлы и сохраняет настройки только при allowWrite=true.",
      inputSchema: importFromInfobaseInputShape,
    },
    createImportFromInfobaseHandler()
  )

  server.registerTool(
    "nkdk.close_platform_connection",
    {
      title: "Close project platform connection",
      description:
        "Закрывает сохранённое соединение проекта с платформой; завершает только процесс 1С, запущенный текущим MCP-процессом.",
      inputSchema: closePlatformConnectionInputShape,
    },
    async (input) => jsonToolResult(await closePlatformConnection(input))
  )

  server.registerTool(
    "nkdk.close_all_platform_connections",
    {
      title: "Close all platform connections",
      description:
        "Закрывает все сохранённые соединения с платформой; завершает только процессы 1С, запущенные текущим MCP-процессом.",
      inputSchema: closeAllPlatformConnectionsInputShape,
    },
    async () => jsonToolResult(await closeAllPlatformConnections())
  )

  server.registerTool(
    "nkdk.sync_to_xml",
    {
      title: "Sync NKDK YAML to 1C XML",
      description:
        "Выгружает один YAML-компонент projectDir/componentPath в заданный xmlDir через файл индекса конфигурации. componentPath по умолчанию cf; xmlDir не вычисляется как xmlRootDir/componentPath. Файлы пишутся только при allowWrite=true.",
      inputSchema: syncToXmlInputShape,
    },
    async (input) => jsonToolResult(await syncToXml(input))
  )

  server.registerTool(
    "nkdk.init_sync_state",
    {
      title: "Initialize NKDK XML sync state",
      description:
        "Создаёт .nkdk-sync.yaml для выбранного YAML-компонента projectDir/componentPath. componentPath по умолчанию cf. Пишет файл только при allowWrite=true.",
      inputSchema: initSyncStateInputShape,
    },
    async (input) => jsonToolResult(await initSyncState(input))
  )

  server.registerTool(
    "nkdk.rename_item",
    {
      title: "Rename NKDK metadata item",
      description:
        "Единственный MCP-способ сохранить XML/reference identity при переименовании metadataRef в выбранном компоненте projectDir/componentPath.",
      inputSchema: renameItemInputShape,
    },
    async (input) => jsonToolResult(await renameItem(input))
  )

  server.registerTool(
    "nkdk.find_references",
    {
      title: "Find NKDK metadata references",
      description:
        "Ищет внешние ссылки на metadataRef в выбранном компоненте projectDir/componentPath. componentPath по умолчанию cf. Файлы не изменяет.",
      inputSchema: findReferencesInputShape,
    },
    async (input) => jsonToolResult(await findReferences(input))
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

export function createImportFromInfobaseHandler(
  service: typeof importFromInfobase = importFromInfobase
) {
  return async (
    input: Parameters<typeof importFromInfobase>[0],
    extra: { signal: AbortSignal }
  ) => jsonToolResult(await service(input, undefined, extra.signal))
}
