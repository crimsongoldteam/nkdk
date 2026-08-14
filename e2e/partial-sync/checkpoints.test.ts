import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { describe, expect, it } from "vitest"
import { openScenarioWorkspace } from "./workspace"
import {
  createCheckpointDependencies,
  publishCheckpoint,
  restoreCheckpoint,
} from "./checkpoints"

describe("partial sync checkpoints", () => {
  it("publishes base and project only after verifying the manifest", async () => {
    const fixture = await checkpointFixture()
    await writeFile(join(fixture.workspace.baseDir, "1Cv8.1CD"), "base")
    await writeFile(join(fixture.workspace.projectDir, "cf.yaml"), "project")

    const state = await publishCheckpoint(fixture.workspace, "01-baseline")

    expect(state.completedStage).toBe("01-baseline")
    await expect(readFile(join(
      fixture.workspace.checkpointsDir,
      "01-baseline/manifest.json"
    ), "utf8")).resolves.toContain("base/1Cv8.1CD")
  })

  it("does not change state when copying fails", async () => {
    const fixture = await checkpointFixture()
    const before = await readFile(fixture.workspace.statePath, "utf8")
    const dependencies = {
      ...createCheckpointDependencies(),
      async copyDirectory() {
        throw new Error("planned copy failure")
      },
    }

    await expect(
      publishCheckpoint(fixture.workspace, "01-baseline", dependencies)
    ).rejects.toThrow("planned copy failure")

    await expect(readFile(fixture.workspace.statePath, "utf8")).resolves.toBe(before)
  })

  it("restores both working copies from the last checkpoint", async () => {
    const fixture = await checkpointFixture()
    await writeFile(join(fixture.workspace.baseDir, "1Cv8.1CD"), "saved base")
    await writeFile(join(fixture.workspace.projectDir, "cf.yaml"), "saved project")
    const state = await publishCheckpoint(fixture.workspace, "01-baseline")
    await writeFile(join(fixture.workspace.baseDir, "1Cv8.1CD"), "broken base")
    await writeFile(join(fixture.workspace.projectDir, "cf.yaml"), "broken project")

    await restoreCheckpoint(fixture.workspace, state)

    await expect(readFile(join(fixture.workspace.baseDir, "1Cv8.1CD"), "utf8"))
      .resolves.toBe("saved base")
    await expect(readFile(join(fixture.workspace.projectDir, "cf.yaml"), "utf8"))
      .resolves.toBe("saved project")
  })

  it("rejects a corrupted checkpoint without changing working copies", async () => {
    const fixture = await checkpointFixture()
    await writeFile(join(fixture.workspace.baseDir, "1Cv8.1CD"), "saved base")
    await writeFile(join(fixture.workspace.projectDir, "cf.yaml"), "saved project")
    const state = await publishCheckpoint(fixture.workspace, "01-baseline")
    await writeFile(join(fixture.workspace.baseDir, "1Cv8.1CD"), "working base")
    await writeFile(join(fixture.workspace.projectDir, "cf.yaml"), "working project")
    await writeFile(
      join(fixture.workspace.checkpointsDir, "01-baseline/base/1Cv8.1CD"),
      "corrupted"
    )

    await expect(restoreCheckpoint(fixture.workspace, state)).rejects.toThrow(/SHA-256/u)

    await expect(readFile(join(fixture.workspace.baseDir, "1Cv8.1CD"), "utf8"))
      .resolves.toBe("working base")
    await expect(readFile(join(fixture.workspace.projectDir, "cf.yaml"), "utf8"))
      .resolves.toBe("working project")
  })
})

async function checkpointFixture() {
  const root = await mkdtemp(join(tmpdir(), "nkdk-partial-sync-checkpoint-"))
  const workspace = await openScenarioWorkspace(root)
  await mkdir(workspace.baseDir, { recursive: true })
  await mkdir(workspace.projectDir, { recursive: true })
  return { workspace }
}
