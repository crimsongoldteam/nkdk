export interface SshShell {
  write(value: string): void
  onData(listener: (chunk: string) => void): () => void
  isOpen(): boolean
  close(): Promise<void>
}

export interface SshTransport {
  connect(params: { host: "127.0.0.1"; port: number; timeoutMs: number }): Promise<SshShell>
}

export interface PlatformCommandSession {
  run(command: string): Promise<void>
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
  kill(signal?: NodeJS.Signals): Promise<void>
}

export interface SessionProcessRuntime {
  spawn(command: string, args: readonly string[]): OwnedProcess
  run(command: string, args: readonly string[]): Promise<{ stdout: string; stderr: string; exitCode: number }>
}

export interface SessionFileSystem {
  mkdir(path: string): Promise<void>
  writeFile(path: string, content: string, options?: { mode?: number }): Promise<void>
  readFile(path: string): Promise<string>
  rm(path: string): Promise<void>
  realpath(path: string): Promise<string>
}

export interface SessionPortRuntime {
  reservePort(host: "127.0.0.1"): Promise<number>
}

export const systemSessionClock: SessionClock = {
  setTimeout: (callback, timeoutMs) => setTimeout(callback, timeoutMs),
  clearTimeout: (timer) => clearTimeout(timer as ReturnType<typeof setTimeout>),
}
