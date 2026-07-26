import { PlatformSessionError, type PlatformSessionErrorCode } from "./errors"
import {
  systemSessionClock,
  type PlatformCommandSession,
  type SessionClock,
  type SshShell,
} from "./runtime"

type PendingExchange = {
  errorCode: PlatformSessionErrorCode
  allowQuestions: boolean
  initialPrompt: boolean
  sawSuccess: boolean
  timer: unknown
  resolve(): void
  reject(error: PlatformSessionError): void
}

export async function openPlatformCommandSession(params: {
  shell: SshShell
  user?: string
  password?: string
  timeoutMs: number
  clock?: SessionClock
  diagnostic?: (message: string) => void
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
      false
    )
    await protocol.execute("common connect-ib", "authentication_failed", true)
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
    await this.beginExchange("session_start_failed", false, true)
  }

  async run(command: string): Promise<void> {
    await this.execute(command, "platform_command_failed", false)
  }

  isAlive(): boolean {
    return this.shell.isOpen()
  }

  async close(): Promise<void> {
    this.unsubscribe()
    const pending = this.pending
    if (pending !== undefined) {
      this.clock.clearTimeout(pending.timer)
      this.pending = undefined
      pending.reject(new PlatformSessionError("session_start_failed", "SSH-сеанс платформы закрыт"))
    }
    await this.shell.close()
  }

  async execute(
    command: string,
    errorCode: PlatformSessionErrorCode,
    allowQuestions: boolean
  ): Promise<void> {
    if (!this.shell.isOpen()) {
      throw new PlatformSessionError(errorCode, "SSH-сеанс платформы закрыт")
    }
    const completion = this.beginExchange(errorCode, allowQuestions, false)
    this.diagnostic("Команда платформы отправлена")
    this.shell.write(`${command}\n`)
    await completion
  }

  private beginExchange(
    errorCode: PlatformSessionErrorCode,
    allowQuestions: boolean,
    initialPrompt: boolean
  ): Promise<void> {
    if (this.pending !== undefined) {
      return Promise.reject(
        new PlatformSessionError(errorCode, "Параллельные команды в одном SSH-сеансе не поддерживаются")
      )
    }
    return new Promise<void>((resolve, reject) => {
      const timer = this.clock.setTimeout(() => {
        if (this.pending === undefined) return
        this.pending = undefined
        reject(new PlatformSessionError("session_timeout", "Истекло время ожидания ответа платформы"))
      }, this.timeoutMs)
      this.pending = {
        errorCode,
        allowQuestions,
        initialPrompt,
        sawSuccess: false,
        timer,
        resolve,
        reject,
      }
      this.consumeBuffer()
    })
  }

  private receive(chunk: string): void {
    this.buffer += chunk
    this.consumeBuffer()
  }

  private consumeBuffer(): void {
    const pending = this.pending
    if (pending === undefined) return
    const prompt = /(?:^|\n)[^\r\n>]*> $/.exec(this.buffer)
    if (prompt === null || prompt.index + prompt[0].length !== this.buffer.length) return

    const body = this.buffer.slice(0, prompt.index).trim()
    this.buffer = ""
    if (pending.initialPrompt && body === "") {
      this.completePending()
      return
    }

    try {
      if (body === "") throw new Error("empty response")
      for (const line of body.split(/\r?\n/).filter((value) => value.trim() !== "")) {
        const messages: unknown = JSON.parse(line)
        if (!Array.isArray(messages)) throw new Error("response is not an array")
        for (const message of messages) this.consumeMessage(message, pending)
      }
      if (this.pending === undefined) return
      if (pending.sawSuccess) this.completePending()
    } catch {
      this.failPending(pending.errorCode, "Платформа вернула неожиданный ответ")
    }
  }

  private consumeMessage(message: unknown, pending: PendingExchange): void {
    if (!isRecord(message) || typeof message["type"] !== "string") {
      throw new Error("invalid message")
    }
    const type = message["type"].toLowerCase()
    if (type === "success") {
      pending.sawSuccess = true
      return
    }
    if (type === "error" || type === "cancel") {
      this.failPending(pending.errorCode, safeFailureMessage(pending.errorCode))
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

  private completePending(): void {
    const pending = this.pending
    if (pending === undefined) return
    this.clock.clearTimeout(pending.timer)
    this.pending = undefined
    pending.resolve()
  }

  private failPending(code: PlatformSessionErrorCode, message: string): void {
    const pending = this.pending
    if (pending === undefined) return
    this.clock.clearTimeout(pending.timer)
    this.pending = undefined
    pending.reject(new PlatformSessionError(code, message))
  }
}

function safeFailureMessage(code: PlatformSessionErrorCode): string {
  return code === "authentication_failed"
    ? "Платформа отклонила подключение к информационной базе"
    : "Команда платформы завершилась с ошибкой"
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}
