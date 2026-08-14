import { cp, mkdir, mkdtemp, readFile, readdir, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { openScenarioWorkspace, readState, writeScenarioState } from "./workspace"
import {
  createCheckpointDependencies,
  publishCheckpoint,
  restoreCheckpoint,
} from "./checkpoints"

const planHash = "a".repeat(64)

describe("partial sync checkpoints", () => {
  it("publishes the first verified copy as current", async () => {
    const fixture = await checkpointFixture()
    await writeWorking(fixture, "first")

    const state = await publishCheckpoint(fixture.workspace, {
      completedOperation: null,
      planHash,
    })

    expect(state).toEqual({
      version: 2,
      scenario: "partial-sync-matrix",
      completedOperation: null,
      checkpoint: "checkpoints/current",
      planHash,
    })
    await expect(readFile(join(
      fixture.workspace.checkpointsDir,
      "current/manifest.json",
    ), "utf8")).resolves.toContain("base/1Cv8.1CD")
  })

  it("replaces current and leaves no historical copies after ordinary successes", async () => {
    const fixture = await checkpointFixture()
    await writeWorking(fixture, "first")
    await publishCheckpoint(fixture.workspace, { completedOperation: "object:first", planHash })
    await writeWorking(fixture, "second")

    await publishCheckpoint(fixture.workspace, { completedOperation: "object:second", planHash })

    expect(await readdir(fixture.workspace.checkpointsDir)).toEqual(["current"])
    await expect(readFile(join(
      fixture.workspace.checkpointsDir,
      "current/base/1Cv8.1CD",
    ), "utf8")).resolves.toBe("second base")
  })

  it("restores both working copies from current", async () => {
    const fixture = await checkpointFixture()
    await writeWorking(fixture, "saved")
    const state = await publishCheckpoint(fixture.workspace, {
      completedOperation: "object:catalog",
      planHash,
    })
    await writeWorking(fixture, "broken")

    await restoreCheckpoint(fixture.workspace, state)

    await expect(readFile(join(fixture.workspace.baseDir, "1Cv8.1CD"), "utf8"))
      .resolves.toBe("saved base")
    await expect(readFile(join(fixture.workspace.projectDir, "cf.yaml"), "utf8"))
      .resolves.toBe("saved project")
  })

  it("preserves state and current when copying the replacement fails", async () => {
    const fixture = await checkpointFixture()
    await writeWorking(fixture, "saved")
    await publishCheckpoint(fixture.workspace, { completedOperation: "object:first", planHash })
    const beforeState = await readFile(fixture.workspace.statePath, "utf8")
    const dependencies = {
      ...createCheckpointDependencies(),
      async copyDirectory() { throw new Error("planned copy failure") },
    }

    await expect(publishCheckpoint(
      fixture.workspace,
      { completedOperation: "object:second", planHash },
      dependencies,
    )).rejects.toThrow("planned copy failure")

    await expect(readFile(fixture.workspace.statePath, "utf8")).resolves.toBe(beforeState)
    await expect(readFile(join(
      fixture.workspace.checkpointsDir,
      "current/base/1Cv8.1CD",
    ), "utf8")).resolves.toBe("saved base")
  })

  it("rolls current back when state publication fails after switching directories", async () => {
    const fixture = await checkpointFixture()
    await writeWorking(fixture, "saved")
    await publishCheckpoint(fixture.workspace, { completedOperation: "object:first", planHash })
    await writeWorking(fixture, "replacement")
    const dependencies = {
      ...createCheckpointDependencies(),
      async writeState() { throw new Error("planned state failure") },
    }

    await expect(publishCheckpoint(
      fixture.workspace,
      { completedOperation: "object:second", planHash },
      dependencies,
    )).rejects.toThrow("planned state failure")

    await expect(readFile(join(
      fixture.workspace.checkpointsDir,
      "current/base/1Cv8.1CD",
    ), "utf8")).resolves.toBe("saved base")
    expect((await readState(fixture.workspace.root)).completedOperation).toBe("object:first")
  })

  it("recovers a consistent previous copy left before state publication", async () => {
    const fixture = await checkpointFixture()
    await writeWorking(fixture, "first")
    const firstState = await publishCheckpoint(fixture.workspace, {
      completedOperation: "object:first",
      planHash,
    })
    const current = join(fixture.workspace.checkpointsDir, "current")
    const crashPrevious = join(fixture.workspace.checkpointsDir, ".current-crash.previous")
    await cp(current, crashPrevious, { recursive: true })
    await writeWorking(fixture, "second")
    await publishCheckpoint(fixture.workspace, { completedOperation: "object:second", planHash })
    await writeScenarioState(fixture.workspace, firstState)

    await restoreCheckpoint(fixture.workspace, firstState)

    await expect(readFile(join(current, "base/1Cv8.1CD"), "utf8"))
      .resolves.toBe("first base")
    await expect(readFile(join(fixture.workspace.baseDir, "1Cv8.1CD"), "utf8"))
      .resolves.toBe("first base")
    expect(await readdir(fixture.workspace.checkpointsDir)).toEqual(["current"])
  })

  it("rejects a corrupted current without changing working copies", async () => {
    const fixture = await checkpointFixture()
    await writeWorking(fixture, "saved")
    const state = await publishCheckpoint(fixture.workspace, {
      completedOperation: "object:catalog",
      planHash,
    })
    await writeWorking(fixture, "working")
    await writeFile(join(
      fixture.workspace.checkpointsDir,
      "current/base/1Cv8.1CD",
    ), "corrupted")

    await expect(restoreCheckpoint(fixture.workspace, state)).rejects.toThrow(/SHA-256/u)
    await expect(readFile(join(fixture.workspace.baseDir, "1Cv8.1CD"), "utf8"))
      .resolves.toBe("working base")
  })
})

async function checkpointFixture() {
  const root = await mkdtemp(join(tmpdir(), "nkdk-partial-sync-checkpoint-"))
  const workspace = await openScenarioWorkspace(root, { planHash, reset: false })
  await mkdir(workspace.baseDir, { recursive: true })
  await mkdir(workspace.projectDir, { recursive: true })
  return { workspace }
}

async function writeWorking(
  fixture: Awaited<ReturnType<typeof checkpointFixture>>,
  value: string,
): Promise<void> {
  await writeFile(join(fixture.workspace.baseDir, "1Cv8.1CD"), `${value} base`)
  await writeFile(join(fixture.workspace.projectDir, "cf.yaml"), `${value} project`)
}
