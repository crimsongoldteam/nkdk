import { describe, expect, it } from "vitest"
import { createInfobaseArchiveStore } from "./infobase-archive"

describe("infobase archive store", () => {
  it("закрывает соединение и публикует только успешный непустой dump", async () => {
    const fixture = archiveFixture()
    const outcome = await fixture.store.dump(params)

    expect(fixture.calls).toEqual([
      "close",
      "remove:C:/run/step.dt.tmp",
      "ibcmd:infobase dump --database-path=C:/run/base --data=C:/run/data C:/run/step.dt.tmp",
      "size:C:/run/step.dt.tmp",
      "move:C:/run/step.dt.tmp->C:/run/step.dt",
      "log:C:/run/archive.log",
    ])
    expect(outcome).toEqual({ elapsedMs: 25, sizeBytes: 1024, requiresReconnect: true })
  })

  it("не публикует dump после ошибки ibcmd", async () => {
    const fixture = archiveFixture({ exitCode: 1 })

    await expect(fixture.store.dump(params)).rejects.toThrow("кодом 1")
    expect(fixture.calls.some((call) => call.startsWith("move:"))).toBe(false)
  })

  it("восстанавливает базу с force и требует переподключение", async () => {
    const fixture = archiveFixture()
    const outcome = await fixture.store.restore(params)

    expect(fixture.calls).toContain(
      "ibcmd:infobase restore --database-path=C:/run/base --data=C:/run/data --force C:/run/step.dt",
    )
    expect(outcome.requiresReconnect).toBe(true)
  })

  it("создаёт новую базу непосредственно из эталонного dt", async () => {
    const fixture = archiveFixture()

    await fixture.store.create(params)

    expect(fixture.calls).toContain(
      "ibcmd:infobase create --database-path=C:/run/base --data=C:/run/data --restore=C:/run/step.dt",
    )
  })
})

const params = {
  baseDir: "C:/run/base",
  dataDir: "C:/run/data",
  archivePath: "C:/run/step.dt",
  logPath: "C:/run/archive.log",
}

function archiveFixture(options: { readonly exitCode?: number } = {}) {
  const calls: string[] = []
  const times = [100, 125]
  const store = createInfobaseArchiveStore(async () => { calls.push("close") }, {
    async findPlatform() {
      return { version: "8.3.27.2214", ibcmdPath: "ibcmd" }
    },
    async runProcess(_command, args) {
      calls.push(`ibcmd:${args.join(" ")}`)
      return { exitCode: options.exitCode ?? 0, stdout: "out", stderr: "err" }
    },
    async remove(path) { calls.push(`remove:${path}`) },
    async move(source, destination) { calls.push(`move:${source}->${destination}`) },
    async fileSize(path) { calls.push(`size:${path}`); return 1024 },
    async writeFile(path) { calls.push(`log:${path}`) },
    now() { return times.shift() ?? 125 },
  })
  return { calls, store }
}
