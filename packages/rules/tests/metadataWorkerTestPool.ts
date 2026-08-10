import { createMockWorkerThreadPoolFactory } from "./mockWorkerThreadPool"
import type {
  MetadataWorkerCommand,
  MetadataWorkerCommandResult,
  MetadataWorkerLine,
  MetadataWorkerPoolHandle,
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
  if (command.kind === "runOperation" && command.command.kind === "probe") {
    return { kind: "probeResult", value: command.command.value }
  }
  return undefined
}

export function createUnusedMetadataWorkerPool(): MetadataWorkerPoolHandle {
  return {
    async beginOperation() { throw new Error("unexpected metadata worker operation") },
    async installProjectState() {},
    async clearProjectState() {},
    size: () => 0,
    async close() {},
  }
}
