import { describe, expect, it } from "vitest"
import { projectGraphName } from "./projectGraphName"

describe("projectGraphName", () => {
  it("строит стабильное безопасное имя graph-БД от абсолютного пути", () => {
    const name = projectGraphName("/repo/yaml")

    expect(name).toMatch(/^nkdk_[a-f0-9]{12}$/)
    expect(projectGraphName("/repo/yaml")).toBe(name)
  })

  it("нормализует относительный путь через resolve", () => {
    expect(projectGraphName(".")).toBe(projectGraphName(process.cwd()))
  })

  it("разводит разные YAML-каталоги по разным graph-БД", () => {
    expect(projectGraphName("/repo/yaml-a")).not.toBe(projectGraphName("/repo/yaml-b"))
  })
})
