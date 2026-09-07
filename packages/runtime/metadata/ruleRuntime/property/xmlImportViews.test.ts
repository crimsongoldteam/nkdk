import { describe, expect, it, vi } from "vitest"
import { XMLImportViews, type XMLImportViewFilter } from "./xmlImportViews"

const createView = (filter: XMLImportViewFilter) => ({
  includeAllTags: filter.includeAllTags,
  tags: filter.tags === undefined ? undefined : [...filter.tags],
})

describe("XMLImportViews", () => {
  it("разделяет все теги, отсутствие фильтра, пустой фильтр и буквальный *", () => {
    const views = new XMLImportViews(createView)
    const results = [
      views.get({ includeAllTags: true }),
      views.get({ includeAllTags: false }),
      views.get({ includeAllTags: false, tags: [] }),
      views.get({ includeAllTags: false, tags: ["*"] }),
    ]
    expect(new Set(results).size).toBe(4)
    expect(views.get({ includeAllTags: true, tags: ["ignored"] })).toBe(results[0])
  })

  it("повторно использует набор независимо от порядка и повторов, не меняя вход", () => {
    const create = vi.fn(createView)
    const views = new XMLImportViews(create)
    const tags = ["B", "", "A", "B"]
    const result = views.get({ includeAllTags: false, tags })
    expect(views.get({ includeAllTags: false, tags: ["", "A", "B"] })).toBe(result)
    expect(tags).toEqual(["B", "", "A", "B"])
    expect(create).toHaveBeenCalledTimes(1)
    tags.push("C")
    expect(views.get({ includeAllTags: false, tags })).not.toBe(result)
  })

  it("не склеивает имена с разделителями и не разделяет кэш между правилами", () => {
    const views = new XMLImportViews(createView)
    const result = views.get({ includeAllTags: false, tags: ["a,b"] })
    expect(views.get({ includeAllTags: false, tags: ["a", "b"] })).not.toBe(result)
    expect(new XMLImportViews(createView).get({ includeAllTags: false, tags: ["a,b"] })).not.toBe(result)
  })

  it("повторяет построение после ошибки, не сохраняя неполный результат", () => {
    const create = vi.fn(createView).mockImplementationOnce(() => { throw new Error("build failed") })
    const views = new XMLImportViews(create)
    expect(() => views.get({ includeAllTags: false })).toThrow("build failed")
    expect(views.get({ includeAllTags: false })).toEqual({ includeAllTags: false, tags: undefined })
    expect(create).toHaveBeenCalledTimes(2)
  })
})
