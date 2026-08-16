export type McpCliOptions =
  | { readonly mode: "stdio"; readonly watch: boolean; readonly worker: boolean }
  | { readonly mode: "http"; readonly port: number }

export class McpCliUsageError extends Error {
  readonly exitCode = 2
}

export function parseMcpCli(argv: readonly string[]): McpCliOptions {
  let http = false
  let watch = false
  let worker = false
  let port: number | undefined

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === "--http") {
      if (http) throw usage("Параметр --http указан повторно")
      http = true
      continue
    }
    if (argument === "--watch") {
      if (watch) throw usage("Параметр --watch указан повторно")
      watch = true
      continue
    }
    if (argument === "--worker") {
      if (worker) throw usage("Параметр --worker указан повторно")
      worker = true
      continue
    }
    if (argument === "--port") {
      if (port !== undefined) throw usage("Параметр --port указан повторно")
      const value = argv[index + 1]
      if (value === undefined || !/^\d+$/u.test(value)) throw usage("Параметр --port требует целое число")
      port = Number(value)
      if (port < 1 || port > 65_535) throw usage("Порт должен находиться в диапазоне 1..65535")
      index += 1
      continue
    }
    throw usage(`Неизвестный параметр: ${argument}`)
  }

  if (http && watch) throw usage("Параметр --watch недоступен в HTTP-режиме")
  if (http && worker) throw usage("Параметр --worker недоступен в HTTP-режиме")
  if (worker && watch) throw usage("Параметры --worker и --watch несовместимы")
  if (!http && port !== undefined) throw usage("Параметр --port допустим только вместе с --http")
  if (http) return { mode: "http", port: port ?? 3000 }
  return { mode: "stdio", watch, worker }
}

function usage(message: string): McpCliUsageError {
  return new McpCliUsageError(message)
}
