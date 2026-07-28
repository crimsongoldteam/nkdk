export interface SshShell {
  write(value: string): void
  onData(listener: (chunk: string) => void): () => void
  isOpen(): boolean
  close(): Promise<void>
}

export interface SshTransport {
  connect(params: {
    host: "127.0.0.1"
    port: number
    timeoutMs: number
    expectedHostKeyHash: string
  }): Promise<SshShell>
}

export interface PlatformCommandSession {
  run(command: string, options?: { signal?: AbortSignal }): Promise<void>
  isAlive(): boolean
  close(): Promise<void>
}

export interface SessionClock {
  setTimeout(callback: () => void, timeoutMs: number): unknown
  clearTimeout(timer: unknown): void
}

export interface OwnedProcess {
  owned: boolean
  isAlive(): boolean
  wait(timeoutMs: number): Promise<boolean>
  waitForOutput(value: string, timeoutMs: number): Promise<void>
  signal?(signal: NodeJS.Signals): Promise<void>
  kill(signal?: NodeJS.Signals): Promise<void>
}

export interface SessionProcessRuntime {
  spawn(command: string, args: readonly string[]): OwnedProcess
  run(
    command: string,
    args: readonly string[],
    options?: ProcessRunOptions
  ): Promise<ProcessRunResult>
}

export type ProcessRunOptions = {
  timeoutMs?: number
  signal?: AbortSignal
  terminationGraceMs?: number
}

export type ProcessRunResult = {
  stdout: string
  stderr: string
  exitCode: number
  timedOut?: boolean
  cancelled?: boolean
}

export interface SessionFileSystem {
  mkdir(path: string): Promise<void>
  writeFile(path: string, content: string, options?: { mode?: number }): Promise<void>
  readFile(path: string): Promise<string>
  rm(path: string): Promise<void>
  rename(from: string, to: string): Promise<void>
  chmod(path: string, mode: number): Promise<void>
  realpath(path: string): Promise<string>
}

export interface SessionPortRuntime {
  reservePort(host: "127.0.0.1"): Promise<number>
}

export const systemSessionClock: SessionClock = {
  setTimeout: (callback, timeoutMs) => setTimeout(callback, timeoutMs),
  clearTimeout: (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>),
}
