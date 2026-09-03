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
  readonly wait?: (milliseconds: number) => Promise<void>
}

export async function openScenarioMcpSession(
  params: OpenScenarioMcpSessionParams
): Promise<ScenarioMcpSession> {
  await mkdir(params.attemptLogDir, { recursive: true })
  const lowLevel = await (params.createSession ?? loadLowLevelSessionFactory())()
  let callNumber = 0
  let lastStderrPath: string | undefined
  let closed = false

  async function loggedCall(
    toolName: string,
    input: unknown,
    attemptLogDir: string,
  ): Promise<LowLevelMcpResponse> {
    if (closed) throw new Error("MCP-сеанс уже закрыт")
    if (!/^[a-z0-9_.-]+$/u.test(toolName)) throw new Error(`Недопустимое имя MCP-инструмента: ${toolName}`)
    callNumber += 1
    const prefix = `${String(callNumber).padStart(3, "0")}-${toolName}`
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
    return response
  }

  return {
    async call<T>(
      toolName: string,
      input: unknown,
      options?: ScenarioMcpCallOptions,
    ): Promise<T> {
      const attemptLogDir = options?.attemptLogDir ?? params.attemptLogDir
      const response = await loggedCall(toolName, input, attemptLogDir)
      if (!isAcceptedOperation(response.payload)) return response.payload as T

      const identity = {
        projectDir: response.payload.projectDir,
        operationId: response.payload.operationId,
      }
      for (;;) {
        const lookup = await loggedCall("nkdk.get_operation", identity, attemptLogDir)
        const snapshot = requireOperationSnapshot(lookup.payload, identity)
        if (snapshot.status === "queued" || snapshot.status === "running") {
          await (params.wait ?? delay)(100)
          continue
        }
        if (snapshot.status === "failed") {
          const error = snapshot["error"]
          const code = typeof error === "object" && error !== null ? Reflect.get(error, "code") : undefined
          const message = typeof error === "object" && error !== null ? Reflect.get(error, "message") : undefined
          throw new Error(`${toolName}: ${String(code ?? "operation_failed")}: ${String(message ?? "Операция завершилась с ошибкой")}`)
        }
        if (snapshot.status === "cancelled" || snapshot.status === "interrupted") {
          throw new Error(`${toolName}: операция ${snapshot.status}`)
        }
        if (snapshot.status !== "succeeded" || typeof snapshot.result !== "object" || snapshot.result === null) {
          throw new Error(`${toolName}: некорректный итог фоновой операции`)
        }
        if (operationFailed(snapshot.result)) {
          const code = Reflect.get(snapshot.result, "code")
          const message = Reflect.get(snapshot.result, "message")
          throw new Error(
            `${toolName}: ${String(code ?? "operation_failed")}: ${String(message ?? "Фоновая операция вернула ok=false")}`
          )
        }
        return snapshot.result as T
      }
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

type AcceptedOperation = {
  readonly ok: true
  readonly status: "accepted"
  readonly projectDir: string
  readonly operationId: string
}

function isAcceptedOperation(value: unknown): value is AcceptedOperation {
  return typeof value === "object" && value !== null && Reflect.get(value, "ok") === true &&
    Reflect.get(value, "status") === "accepted" && typeof Reflect.get(value, "projectDir") === "string" &&
    typeof Reflect.get(value, "operationId") === "string"
}

function requireOperationSnapshot(
  value: unknown,
  identity: { readonly projectDir: string; readonly operationId: string },
): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Reflect.get(value, "ok") !== true ||
    Reflect.get(value, "projectDir") !== identity.projectDir ||
    Reflect.get(value, "operationId") !== identity.operationId ||
    !["queued", "running", "succeeded", "failed", "cancelled", "interrupted"].includes(String(Reflect.get(value, "status")))) {
    throw new Error(`Некорректное состояние фоновой операции ${identity.operationId}`)
  }
  return value as Record<string, unknown>
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds))
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

function errorMessage(value: unknown): string {
  return value instanceof Error ? value.message : String(value)
}
