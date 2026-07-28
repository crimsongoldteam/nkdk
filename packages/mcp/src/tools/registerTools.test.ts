import { describe, expect, it, vi } from "vitest"
import * as registerToolsModule from "./registerTools"

const { registerNkdkCapabilities } = registerToolsModule

describe("registerNkdkCapabilities", () => {
  it("registers operation tools, base tools, resources, and prompts", () => {
    const calls = {
      tools: [] as string[],
      resources: [] as string[],
      prompts: [] as string[],
    }
    const server = {
      registerTool: vi.fn((name: string, _options?: unknown, _handler?: unknown) => calls.tools.push(name)),
      registerResource: vi.fn((name: string) => calls.resources.push(name)),
      registerPrompt: vi.fn((name: string) => calls.prompts.push(name)),
    }

    registerNkdkCapabilities(server as unknown as Parameters<typeof registerNkdkCapabilities>[0])

    expect(calls.tools).toEqual([
      "nkdk.get_schema",
      "nkdk.describe_project_structure",
      "nkdk.list_infobases",
      "nkdk.validate_project",
      "nkdk.import_from_xml",
      "nkdk.import_from_infobase",
      "nkdk.close_platform_connection",
      "nkdk.close_all_platform_connections",
      "nkdk.sync_to_xml",
      "nkdk.init_sync_state",
      "nkdk.rename_item",
      "nkdk.find_references",
    ])
    expect(calls.resources).toEqual([
      "config-edit-yaml",
      "config-import-from-xml",
      "config-sync-to-xml",
      "config-validate-yaml",
    ])
    expect(calls.prompts).toEqual([
      "nkdk_config_edit_yaml",
      "nkdk_config_import_from_xml",
      "nkdk_config_sync_to_xml",
      "nkdk_config_validate_yaml",
    ])

    const importTool = server.registerTool.mock.calls.find(([name]) => name === "nkdk.import_from_xml")?.[1] as
      | { description: string }
      | undefined
    expect(importTool?.description).toContain("одного компонента")
    expect(importTool?.description).toContain("цель должна отсутствовать или быть пустой")
    expect(importTool?.description).toContain("расширения путь определяется из Configuration.xml")
    expect(importTool?.description).toContain("componentPath передавать не требуется")
    expect(importTool?.description).not.toContain(".nkdk/tmp/import/<operation-id>")
    expect(importTool?.description).toContain("не подключается к 1С")
    expect(importTool?.description).toContain("не импортирует все компоненты")

    const infobaseImportTool = server.registerTool.mock.calls.find(
      ([name]) => name === "nkdk.import_from_infobase"
    )?.[1] as { description: string } | undefined
    expect(infobaseImportTool?.description).toContain("allowWrite=true")
    expect(infobaseImportTool?.description).toContain("пустой cf")
    expect(infobaseImportTool?.description).toContain("Запускает 1С")
    expect(infobaseImportTool?.description).toContain("параметры СУБД")

    for (const name of [
      "nkdk.close_platform_connection",
      "nkdk.close_all_platform_connections",
    ]) {
      const tool = server.registerTool.mock.calls.find(([registered]) => registered === name)?.[1] as
        | { description: string }
        | undefined
      expect(tool?.description).toContain("текущим MCP-процессом")
    }

    const syncTool = server.registerTool.mock.calls.find(([name]) => name === "nkdk.sync_to_xml")?.[1] as
      | { description: string }
      | undefined
    expect(syncTool?.description).toContain("файл индекса конфигурации")
    expect(syncTool?.description).toContain("projectDir/componentPath")
    expect(syncTool?.description).toContain("xmlRootDir/componentPath")
    expect(syncTool?.description).not.toContain("reference")

    const listInfobasesTool = server.registerTool.mock.calls.find(([name]) => name === "nkdk.list_infobases")?.[1] as
      | { description: string }
      | undefined
    expect(listInfobasesTool?.description).toContain("личного и общих списков")
    expect(listInfobasesTool?.description).toContain("дерево")
    expect(listInfobasesTool?.description).toContain("Не изменяет файлы")
  })

  it("passes the MCP cancellation signal to infobase import", async () => {
    const factory = (registerToolsModule as Record<string, unknown>)[
      "createImportFromInfobaseHandler"
    ]
    expect(factory).toBeTypeOf("function")
    const service = vi.fn().mockResolvedValue({
      ok: false,
      code: "operation_cancelled",
      message: "cancelled",
    })
    const handler = (
      factory as (
        serviceFunction: typeof service
      ) => (
        input: Record<string, unknown>,
        extra: { signal: AbortSignal }
      ) => Promise<unknown>
    )(service)
    const input = {
      projectDir: "/project",
      connectionString: 'File="/bases/demo";',
      allowWrite: true,
    }
    const controller = new AbortController()

    await handler(input, { signal: controller.signal })

    expect(service).toHaveBeenCalledWith(input, undefined, controller.signal)
  })
})
