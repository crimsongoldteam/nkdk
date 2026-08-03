import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { expect, it } from "vitest"
import { discoverProjectStateValidationFileBatches } from "./projectFiles"

it("выдаёт файлы проекта ограниченными пачками без общего массива", async () => {
  const projectDir = await mkdtemp(join(tmpdir(), "nkdk-project-files-"))
  try {
    await mkdir(join(projectDir, "cf"), { recursive: true })
    await writeFile(join(projectDir, "cf", "Конфигурация.yaml"), "Имя: Тест\n")
    await writeFile(join(projectDir, "cf", "ДополнительныйФайл.bin"), "data")

    const batches = discoverProjectStateValidationFileBatches(projectDir, 1)
    const first = await batches.next()
    expect(first.done).toBe(false)
    expect(first.value?.files).toHaveLength(1)

    const remaining = []
    for await (const batch of batches) remaining.push(...batch.files)
    expect([...(first.value?.files ?? []), ...remaining].map(({ identity }) => identity.projectPath))
      .toContain("cf/Конфигурация.yaml")
  } finally {
    await rm(projectDir, { recursive: true, force: true })
  }
})
