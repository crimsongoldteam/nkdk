export interface MockWorkerThreadPoolFactory<TCommand, TResult> {
  readonly factory: () => {
    run(command: TCommand): Promise<TResult>
    destroy(): Promise<void>
  }
  commands(workerIndex: number): readonly TCommand[]
  created(): number
  destroyCalls(workerIndex: number): number
}

export function createMockWorkerThreadPoolFactory<TCommand, TResult>(
  handler: (
    command: TCommand,
    workerIndex: number
  ) => TResult | Promise<TResult>
): MockWorkerThreadPoolFactory<TCommand, TResult> {
  const records: Array<{
    commands: TCommand[]
    destroyCalls: number
  }> = []

  return {
    factory() {
      const workerIndex = records.length
      const record: {
        commands: TCommand[]
        destroyCalls: number
      } = { commands: [], destroyCalls: 0 }
      records.push(record)

      return {
        async run(command) {
          record.commands.push(command)
          return handler(command, workerIndex)
        },
        async destroy() {
          if (record.destroyCalls === 0) record.destroyCalls = 1
        },
      }
    },
    commands(workerIndex) {
      return [...(records[workerIndex]?.commands ?? [])]
    },
    created() {
      return records.length
    },
    destroyCalls(workerIndex) {
      return records[workerIndex]?.destroyCalls ?? 0
    },
  }
}
