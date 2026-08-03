import { createMockWorkerThreadPoolFactory } from "./mockWorkerThreadPool"
import type {
  MetadataWorkerCommand,
  MetadataWorkerCommandResult,
  MetadataWorkerLine,
} from "../metadata/workerPool/types"

export function createMetadataWorkerLineFactory(
  handler: (
    command: MetadataWorkerCommand,
    workerIndex: number
  ) => MetadataWorkerCommandResult | Promise<MetadataWorkerCommandResult> = defaultHandler
) {
  const lines = createMockWorkerThreadPoolFactory(handler)
  return {
    factory: lines.factory as () => MetadataWorkerLine,
    created: () => lines.created(),
    destroyed: () => Array.from({ length: lines.created() }, (_, index) => lines.destroyCalls(index)),
    commands: (workerIndex: number) => lines.commands(workerIndex),
    lastCommand: (workerIndex: number) => lines.commands(workerIndex).at(-1),
  }
}

function defaultHandler(command: MetadataWorkerCommand): MetadataWorkerCommandResult {
  if (command.kind === "runOperation") {
    return { kind: "probeResult", value: command.command.value }
  }
  return undefined
}
