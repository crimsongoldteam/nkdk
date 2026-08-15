import { appendFile, mkdir, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"

export type LowLevelMcpResponse = {
  readonly result: { readonly isError?: boolean; readonly [key: string]: unknown }
  readonly payload: unknown
}

export type LowLevelMcpSession = {
  call(toolName: string, input: unknown): Promise<LowLevelMcpResponse>
  takeStderr(): string
  close(): Promise<void>
}

export type ScenarioMcpCallOptions = {
  readonly attemptLogDir?: string
}

export type ScenarioMcpSession = {
  call<T>(
    toolName: string,
    input: unknown,
    options?: ScenarioMcpCallOptions,
  ): Promise<T>
  close(): Promise<void>
}

type OpenScenarioMcpSessionParams = {
  readonly attemptLogDir: string
  readonly createSession?: () => Promise<LowLevelMcpSession>
}

export async function openScenarioMcpSession(
  params: OpenScenarioMcpSessionParams
): Promise<ScenarioMcpSession> {
  await mkdir(params.attemptLogDir, { recursive: true })
  const lowLevel = await (params.createSession ?? loadLowLevelSessionFactory())()
  let callNumber = 0
  let lastStderrPath: string | undefined
  let closed = false

  return {
    async call<T>(
      toolName: string,
      input: unknown,
      options?: ScenarioMcpCallOptions,
    ): Promise<T> {
      if (closed) throw new Error("MCP-сеанс уже закрыт")
      if (!/^[a-z0-9_.-]+$/u.test(toolName)) throw new Error(`Недопустимое имя MCP-инструмента: ${toolName}`)
      callNumber += 1
      const prefix = `${String(callNumber).padStart(3, "0")}-${toolName}`
      const attemptLogDir = options?.attemptLogDir ?? params.attemptLogDir
      await mkdir(attemptLogDir, { recursive: true })
      const requestPath = join(attemptLogDir, `${prefix}.request.json`)
      const responsePath = join(attemptLogDir, `${prefix}.response.json`)
      const stderrPath = join(attemptLogDir, `${prefix}.server.stderr.log`)
      lastStderrPath = stderrPath
      await writeJson(requestPath, { name: toolName, arguments: input })

      let response: LowLevelMcpResponse
      try {
        response = await lowLevel.call(toolName, input)
      } catch (caught) {
        await writeJson(responsePath, { transportError: errorMessage(caught) })
        await writeFile(stderrPath, lowLevel.takeStderr(), "utf8")
        throw new Error(`${toolName}: ${responsePath}`, { cause: caught })
      }

      await writeJson(responsePath, response)
      await writeFile(stderrPath, lowLevel.takeStderr(), "utf8")
      if (response.result.isError === true || operationFailed(response.payload)) {
        throw new Error(`${toolName}: ${responsePath}`)
      }
      return response.payload as T
    },
    async close(): Promise<void> {
      if (closed) return
      closed = true
      try {
        await lowLevel.close()
      } finally {
        const remainingStderr = lowLevel.takeStderr()
        if (remainingStderr.length > 0) {
          const path = lastStderrPath ?? join(params.attemptLogDir, "000-session.server.stderr.log")
          await appendFile(path, remainingStderr, "utf8")
        }
      }
    },
  }
}

function loadLowLevelSessionFactory(): () => Promise<LowLevelMcpSession> {
  return async () => {
    const modulePath = resolve(import.meta.dirname, "../../.agents/tools/mcp/call.mjs")
    const module: unknown = await import(pathToFileURL(modulePath).href)
    return adaptMcpModule(module)()
  }
}

export function adaptMcpModule(value: unknown): () => Promise<LowLevelMcpSession> {
  if (typeof value !== "object" || value === null) throw new Error("Не удалось загрузить MCP-клиент")
  const factory = Reflect.get(value, "createMcpToolSession")
  if (typeof factory !== "function") throw new Error("MCP-клиент не экспортирует createMcpToolSession")
  return async () => {
    const session: unknown = await Reflect.apply(factory, value, [{ serverMode: "compiled" }])
    if (!isLowLevelSession(session)) throw new Error("MCP-клиент вернул несовместимый сеанс")
    return session
  }
}

function isLowLevelSession(value: unknown): value is LowLevelMcpSession {
  return typeof value === "object" && value !== null &&
    typeof Reflect.get(value, "call") === "function" &&
    typeof Reflect.get(value, "takeStderr") === "function" &&
    typeof Reflect.get(value, "close") === "function"
}

function operationFailed(payload: unknown): boolean {
  return typeof payload === "object" && payload !== null && Reflect.get(payload, "ok") === false
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

function errorMessage(value: unknown): string {
  return value instanceof Error ? value.message : String(value)
}
