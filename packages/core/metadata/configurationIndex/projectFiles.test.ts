import fs from "fs"
import { tmpdir } from "os"
import { dirname, join } from "path"
import { afterEach, describe, expect, it } from "vitest"
import { hashFileBytes } from "./hash"
import { hashConfigurationProjectFileList, hashConfigurationProjectFiles } from "./projectFiles"

describe("hashConfigurationProjectFiles", () => {
  const projectDirs: string[] = []

  afterEach(async () => {
    await Promise.all(projectDirs.splice(0).map((projectDir) => fs.promises.rm(projectDir, { recursive: true })))
  })

  async function createProjectFixture(): Promise<string> {
    const projectDir = await fs.promises.mkdtemp(join(tmpdir(), "nkdk-project-files-"))
    projectDirs.push(projectDir)

    await writeProjectFile(projectDir, "Конфигурация.yaml", Buffer.from("Имя: Тест\r\n", "utf-8"))
    await writeProjectFile(projectDir, "ОбщаяФорма/Редактор/Свойства.yaml", Buffer.from("Имя: Редактор\n", "utf-8"))
    await writeProjectFile(projectDir, "ОбщаяФорма/Редактор/Form.bin", Buffer.from([0, 255, 10, 13]))
    await writeProjectFile(projectDir, "unknown.yaml", Buffer.from("ignored", "utf-8"))

    return projectDir
  }

  async function writeProjectFile(projectDir: string, projectPath: string, content: Uint8Array): Promise<void> {
    const filePath = join(projectDir, ...projectPath.split("/"))
    await fs.promises.mkdir(dirname(filePath), { recursive: true })
    await fs.promises.writeFile(filePath, content)
  }

  it("hashes all rule-guided files by raw bytes and excludes .nkdk", async () => {
    const projectDir = await createProjectFixture()
    await writeProjectFile(projectDir, ".nkdk/tmp/ignored.yaml", Buffer.from("ignored", "utf-8"))

    const entries = await hashConfigurationProjectFiles(projectDir, { concurrency: 2 })

    expect(entries.map((entry) => entry.projectPath)).toContain("Конфигурация.yaml")
    expect(entries.some((entry) => entry.projectPath.startsWith(".nkdk/"))).toBe(false)
    expect(entries).toEqual(
      [...entries].sort((left, right) => Buffer.compare(Buffer.from(left.projectPath), Buffer.from(right.projectPath)))
    )
    expect(entries.find((entry) => entry.projectPath.endsWith("Form.bin"))?.contentHash).toBe(
      hashFileBytes(Buffer.from([0, 255, 10, 13]))
    )
  })

  it.each([0, -1, 1.5, Number.NaN])("rejects invalid concurrency %s", async (concurrency) => {
    const projectDir = await createProjectFixture()

    await expect(hashConfigurationProjectFiles(projectDir, { concurrency })).rejects.toThrow("concurrency")
  })

  it("hashes only the requested project file list", async () => {
    const projectDir = await createProjectFixture()

    const entries = await hashConfigurationProjectFileList(
      projectDir,
      ["ОбщаяФорма/Редактор/Form.bin", "Конфигурация.yaml"],
      { concurrency: 2 }
    )

    expect(entries.map((entry) => entry.projectPath)).toEqual([
      "Конфигурация.yaml",
      "ОбщаяФорма/Редактор/Form.bin",
    ])
    expect(entries.find((entry) => entry.projectPath === "Конфигурация.yaml")?.contentHash).toBe(
      hashFileBytes(Buffer.from("Имя: Тест\r\n", "utf-8"))
    )
  })
})
