import { PlatformSessionError, type PlatformSessionErrorCode } from "./errors"
import { redactPlatformText, type PlatformOperationLog } from "./operationLog"
import {
  systemSessionClock,
  type PlatformCommandSession,
  type PlatformCommandResult,
  type SessionClock,
  type SshShell,
} from "./runtime"

type PendingExchange = {
  errorCode: PlatformSessionErrorCode
  allowQuestions: boolean
  initialPrompt: boolean
  sawSuccess: boolean
  extensionInfo?: unknown[]
  timer?: unknown
  removeAbortListener?: () => void
  operationLog?: PlatformOperationLog
  resolve(result: PlatformCommandResult): void
  reject(error: PlatformSessionError): void
}

type ExchangeOptions = {
  timeoutMs?: number
  signal?: AbortSignal
  operationLog?: PlatformOperationLog
}

export async function openPlatformCommandSession(params: {
  shell: SshShell
  user?: string
  password?: string
  timeoutMs: number
  clock?: SessionClock
  diagnostic?: (message: string) => void
  operationLog?: PlatformOperationLog
}): Promise<PlatformCommandSession> {
  if (!params.shell.isOpen()) {
    throw new PlatformSessionError("session_start_failed", "SSH-сеанс платформы закрыт")
  }

  const protocol = new PlatformCommandProtocol({
    shell: params.shell,
    user: params.user ?? "",
    password: params.password ?? "",
    timeoutMs: params.timeoutMs,
    clock: params.clock ?? systemSessionClock,
    diagnostic: params.diagnostic ?? (() => undefined),
  })
  try {
    await protocol.waitForPrompt()
    await protocol.execute(
      "options set --output-format=json",
      "session_start_failed",
      false,
      { timeoutMs: params.timeoutMs, operationLog: params.operationLog }
    )
    await protocol.execute(
      "common connect-ib",
      "authentication_failed",
      true,
      { timeoutMs: params.timeoutMs, operationLog: params.operationLog }
    )
    return protocol
  } catch (caught) {
    await protocol.close()
    throw caught
  }
}

class PlatformCommandProtocol implements PlatformCommandSession {
  private readonly shell: SshShell
  private readonly user: string
  private readonly password: string
  private readonly timeoutMs: number
  private readonly clock: SessionClock
  private readonly diagnostic: (message: string) => void
  private readonly unsubscribe: () => void
  private pending: PendingExchange | undefined
  private buffer = ""

  constructor(params: {
    shell: SshShell
    user: string
    password: string
    timeoutMs: number
    clock: SessionClock
    diagnostic: (message: string) => void
  }) {
    this.shell = params.shell
    this.user = params.user
    this.password = params.password
    this.timeoutMs = params.timeoutMs
    this.clock = params.clock
    this.diagnostic = params.diagnostic
    this.unsubscribe = this.shell.onData((chunk) => this.receive(chunk))
  }

  async waitForPrompt(): Promise<void> {
    await this.beginExchange(
      "session_start_failed",
      false,
      true,
      { timeoutMs: this.timeoutMs }
    )
  }

  async run(
    command: string,
    options?: { signal?: AbortSignal; timeoutMs?: number; operationLog?: PlatformOperationLog }
  ): Promise<PlatformCommandResult> {
    return this.execute(command, "platform_command_failed", false, options)
  }

  isAlive(): boolean {
    return this.shell.isOpen()
  }

  async close(): Promise<void> {
    this.unsubscribe()
    const pending = this.pending
    if (pending !== undefined) {
      this.cleanupPending(pending)
      this.pending = undefined
      pending.reject(new PlatformSessionError("session_start_failed", "SSH-сеанс платформы закрыт"))
    }
    await this.shell.close()
  }

  async execute(
    command: string,
    errorCode: PlatformSessionErrorCode,
    allowQuestions: boolean,
    options: ExchangeOptions = {}
  ): Promise<PlatformCommandResult> {
    if (!this.shell.isOpen()) {
      throw new PlatformSessionError(errorCode, "SSH-сеанс платформы закрыт")
    }
    if (options.signal?.aborted === true) {
      throw new PlatformSessionError(
        "operation_cancelled",
        "Операция платформы отменена"
      )
    }
    const completion = this.beginExchange(
      errorCode,
      allowQuestions,
      false,
      options
    )
    this.diagnostic("Команда платформы отправлена")
    this.shell.write(`${command}\n`)
    return completion
  }

  private beginExchange(
    errorCode: PlatformSessionErrorCode,
    allowQuestions: boolean,
    initialPrompt: boolean,
    options: ExchangeOptions
  ): Promise<PlatformCommandResult> {
    if (this.pending !== undefined) {
      return Promise.reject(
        new PlatformSessionError(errorCode, "Параллельные команды в одном SSH-сеансе не поддерживаются")
      )
    }
    return new Promise<PlatformCommandResult>((resolve, reject) => {
      const pending: PendingExchange = {
        errorCode,
        allowQuestions,
        initialPrompt,
        sawSuccess: false,
        ...(options.operationLog === undefined ? {} : { operationLog: options.operationLog }),
        resolve,
        reject,
      }
      if (options.timeoutMs !== undefined) {
        pending.timer = this.clock.setTimeout(() => {
          if (this.pending !== pending) return
          this.cleanupPending(pending)
          this.pending = undefined
          reject(
            new PlatformSessionError(
              "session_timeout",
              "Истекло время ожидания ответа платформы"
            )
          )
        }, options.timeoutMs)
      }
      if (options.signal !== undefined) {
        const signal = options.signal
        const abort = () => {
          if (this.pending !== pending) return
          this.cleanupPending(pending)
          this.pending = undefined
          reject(
            new PlatformSessionError(
              "operation_cancelled",
              "Операция платформы отменена"
            )
          )
        }
        signal.addEventListener("abort", abort, { once: true })
        pending.removeAbortListener = () =>
          signal.removeEventListener("abort", abort)
        this.pending = pending
        if (signal.aborted) {
          abort()
          return
        }
      }
      this.pending = pending
      this.consumeBuffer()
    })
  }

  private receive(chunk: string): void {
    if (this.pending === undefined) return
    this.buffer += chunk
    this.consumeBuffer()
  }

  private consumeBuffer(): void {
    const pending = this.pending
    if (pending === undefined) return
    const prompt = /(?:[a-z][a-z0-9_-]*|@[0-9a-f-]+)> ?$/i.exec(this.buffer)
    if (pending.initialPrompt) {
      if (prompt === null) return
      this.buffer = ""
      this.completePending()
      return
    }

    if (prompt !== null) {
      const body = this.buffer.slice(0, prompt.index).trim()
      this.buffer = ""
      if (body === "") return
      this.consumeJsonResponse(body, pending)
      return
    }

    const body = this.buffer.trim()
    if (body === "") return
    let messages: unknown
    try {
      messages = JSON.parse(body)
    } catch {
      // JSON может приходить несколькими частями; ждём остаток или приглашение.
      return
    }
    this.buffer = ""
    if (!Array.isArray(messages)) {
      this.failPending(
        pending.errorCode,
        "Платформа вернула неожиданный ответ"
      )
      return
    }
    try {
      this.consumeMessages(messages, pending)
    } catch {
      this.failPending(
        pending.errorCode,
        "Платформа вернула неожиданный ответ"
      )
    }
  }

  private consumeJsonResponse(body: string, pending: PendingExchange): void {
    try {
      const messages: unknown = JSON.parse(body)
      if (!Array.isArray(messages)) throw new Error("response is not an array")
      this.consumeMessages(messages, pending)
    } catch {
      this.failPending(pending.errorCode, "Платформа вернула неожиданный ответ")
    }
  }

  private consumeMessages(messages: unknown[], pending: PendingExchange): void {
    for (const message of messages) this.consumeMessage(message, pending)
    if (this.pending === pending && pending.sawSuccess) this.completePending()
  }

  private consumeMessage(message: unknown, pending: PendingExchange): void {
    if (!isRecord(message) || typeof message["type"] !== "string") {
      throw new Error("invalid message")
    }
    const type = message["type"].toLowerCase()
    if (type === "success") {
      this.captureExtensionProperties(message["body"], pending)
      pending.sawSuccess = true
      return
    }
    if (type === "error" || type === "cancel") {
      const platformMessage = extractFailureMessage(message)
      const fallback = safeFailureMessage(pending.errorCode)
      const passwordSafe = redactPlatformText(platformMessage ?? fallback, [this.password])
      this.failPending(
        pending.errorCode,
        pending.operationLog?.sanitize(passwordSafe) ?? passwordSafe
      )
      return
    }
    if (type !== "question" || !pending.allowQuestions || typeof message["message"] !== "string") {
      throw new Error("unexpected message")
    }

    const question = message["message"].toLowerCase()
    if (question.includes("password") || question.includes("парол")) {
      this.diagnostic("Отправлен ответ на запрос пароля")
      this.shell.write(`${this.password}\n`)
      return
    }
    if (question.includes("user") || question.includes("пользовател") || question.includes("имя")) {
      this.diagnostic("Отправлен ответ на запрос имени пользователя")
      this.shell.write(`${this.user}\n`)
      return
    }
    throw new Error("unknown question")
  }

  private captureExtensionProperties(
    body: unknown,
    pending: PendingExchange
  ): void {
    if (!Array.isArray(body)) {
      pending.extensionInfo = undefined
      return
    }
    const extensionInfo: unknown[] = []
    for (const item of body) {
      if (
        !isRecord(item) ||
        typeof item["type"] !== "string" ||
        item["type"].toLowerCase() !== "extension-properties"
      ) {
        pending.extensionInfo = undefined
        return
      }
      if (!Object.hasOwn(item, "body")) {
        throw new Error("extension-properties body is missing")
      }
      extensionInfo.push(item["body"])
    }
    pending.extensionInfo = extensionInfo
  }

  private completePending(): void {
    const pending = this.pending
    if (pending === undefined) return
    this.cleanupPending(pending)
    this.pending = undefined
    pending.resolve(
      pending.extensionInfo === undefined
        ? {}
        : { extensionInfo: [...pending.extensionInfo] }
    )
  }

  private failPending(code: PlatformSessionErrorCode, message: string): void {
    const pending = this.pending
    if (pending === undefined) return
    this.cleanupPending(pending)
    this.pending = undefined
    pending.reject(new PlatformSessionError(code, message))
  }

  private cleanupPending(pending: PendingExchange): void {
    if (pending.timer !== undefined) this.clock.clearTimeout(pending.timer)
    pending.removeAbortListener?.()
  }
}

function safeFailureMessage(code: PlatformSessionErrorCode): string {
  return code === "authentication_failed"
    ? "Платформа отклонила подключение к информационной базе"
    : "Команда платформы завершилась с ошибкой"
}

function extractFailureMessage(message: Record<string, unknown>): string | undefined {
  if (typeof message["message"] === "string" && message["message"].trim() !== "") {
    return message["message"]
  }
  return typeof message["body"] === "string" && message["body"].trim() !== ""
    ? message["body"]
    : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
