import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { jsonToolResult } from "../contracts/common"
import { describeProjectStructureInputShape } from "../contracts/describeProjectStructure"
import { getSchemaInputShape } from "../contracts/getSchema"
import { importFromXmlInputShape } from "../contracts/importFromXml"
import { initSyncStateInputShape } from "../contracts/initSyncState"
import { findReferencesInputShape, renameItemInputShape } from "../contracts/operations"
import { syncToXmlInputShape } from "../contracts/syncToXml"
import { validateProjectInputShape } from "../contracts/validateProject"
import { guideDefinitions } from "../guides"
import { promptDefinitions } from "../prompts"
import { describeProjectStructure } from "../services/describeProjectStructure"
import { getSchema } from "../services/getSchema"
import { importFromXml } from "../services/importFromXml"
import { initSyncState } from "../services/initSyncState"
import { findReferences } from "../services/findReferences"
import { renameItem } from "../services/renameItem"
import { syncToXml } from "../services/syncToXml"
import { validateYamlProject } from "../services/validateProject"

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
        "Импортирует готовую XML-выгрузку одного компонента из xmlDir в projectDir. Для расширения путь определяется из Configuration.xml, componentPath передавать не требуется; при передаче он служит ограничением, цель должна отсутствовать или быть пустой. Операция не подключается к 1С и не импортирует все компоненты за один вызов. Пишет файлы только при allowWrite=true.",
      inputSchema: importFromXmlInputShape,
    },
    async (input) => jsonToolResult(await importFromXml(input))
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
