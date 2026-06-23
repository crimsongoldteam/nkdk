import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { jsonToolResult } from "../contracts/common"
import { getSchemaInputShape, getSchemaOutputShape } from "../contracts/getSchema"
import { importFromXmlInputShape, importFromXmlOutputShape } from "../contracts/importFromXml"
import { syncToXmlInputShape, syncToXmlOutputShape } from "../contracts/syncToXml"
import { validateProjectInputShape, validateProjectOutputShape } from "../contracts/validateProject"
import { guideDefinitions } from "../guides"
import { promptDefinitions } from "../prompts"
import { getSchema } from "../services/getSchema"
import { importFromXml } from "../services/importFromXml"
import { syncToXml } from "../services/syncToXml"
import { validateYamlProject } from "../services/validateProject"

type RegisterableServer = Pick<McpServer, "registerTool" | "registerResource" | "registerPrompt">

export function registerNkdkCapabilities(server: RegisterableServer): void {
  server.registerTool(
    "nkdk.get_schema",
    {
      title: "Get NKDK YAML schema",
      description: "Возвращает JSON Schema или краткую JSON-сводку схемы YAML-файла NKDK.",
      inputSchema: getSchemaInputShape,
      outputSchema: getSchemaOutputShape,
    },
    (input) => jsonToolResult(getSchema(input)),
  )

  server.registerTool(
    "nkdk.validate_project",
    {
      title: "Validate NKDK YAML project",
      description: "Проверяет YAML-проект NKDK и возвращает diagnostics в JSON.",
      inputSchema: validateProjectInputShape,
      outputSchema: validateProjectOutputShape,
    },
    (input) => jsonToolResult(validateYamlProject(input)),
  )

  server.registerTool(
    "nkdk.import_from_xml",
    {
      title: "Import 1C XML to NKDK YAML",
      description: "Импортирует XML-выгрузку 1С в YAML-проект. Пишет файлы только при allowWrite=true.",
      inputSchema: importFromXmlInputShape,
      outputSchema: importFromXmlOutputShape,
    },
    async (input) => jsonToolResult(await importFromXml(input)),
  )

  server.registerTool(
    "nkdk.sync_to_xml",
    {
      title: "Sync NKDK YAML to 1C XML",
      description: "Синхронизирует YAML-проект в XML-выгрузку. Пишет файлы только при allowWrite=true.",
      inputSchema: syncToXmlInputShape,
      outputSchema: syncToXmlOutputShape,
    },
    async (input) => jsonToolResult(await syncToXml(input)),
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
      }),
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
      }),
    )
  }
}
