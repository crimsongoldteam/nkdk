import type { McpServer } from "@modelcontextprotocol/server"
import {
  PROJECT_SETTINGS_SCHEMA_URI,
  projectSettingsJsonSchema,
} from "@nkdk/platform"

export const projectSettingsSchemaResource = {
  name: "project-settings-schema",
  uri: PROJECT_SETTINGS_SCHEMA_URI,
  title: "Схема настроек проекта",
  description: "JSON Schema файла .nkdk/project.yaml для операций с информационной базой.",
  mimeType: "application/schema+json",
  text: JSON.stringify(projectSettingsJsonSchema),
} as const

export function registerProjectSettingsSchemaResource(
  server: Pick<McpServer, "registerResource">
): void {
  server.registerResource(
    projectSettingsSchemaResource.name,
    projectSettingsSchemaResource.uri,
    {
      title: projectSettingsSchemaResource.title,
      description: projectSettingsSchemaResource.description,
      mimeType: projectSettingsSchemaResource.mimeType,
    },
    (uri) => ({
      contents: [{
        uri: uri.href,
        mimeType: projectSettingsSchemaResource.mimeType,
        text: projectSettingsSchemaResource.text,
      }],
    })
  )
}
