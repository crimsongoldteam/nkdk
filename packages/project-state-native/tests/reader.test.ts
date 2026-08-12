import { describe, expect, it } from "vitest"
import {
  decodeRustFileBaselineResponse,
  decodeRustFileComparisonResponse,
  decodeRustTargetResponse,
  encodeRustFileBaselineRequest,
  encodeRustFileComparisonRequest,
  encodeRustTargetRequest,
} from "../../rules/metadata/projectState/rust/protocol"
import { openProjectStateReader, type ProjectStateSections } from "../index.js"
import {
  fileBackedTargetSnapshot,
  sectionViews,
  snapshotView,
  targetSnapshot,
  unicodeSnapshot,
} from "./project-state-fixture.mjs"

describe("Rust ProjectState reader", () => {
  it("открывает текущий снимок 0.5.0 без копирования секций", () => {
    const buffers = unicodeSnapshot()
    const expected = snapshotView(buffers).filePaths()
    const reader = openProjectStateReader(sectionViews(buffers))

    expect(reader.stats()).toEqual({
      format: "0.5.0",
      files: 5,
      copiedSnapshotBytes: 0,
      decodedStringCacheBytes: 0,
    })
    expect(reader.filePaths()).toEqual(expected)
    reader.close()
  })

  it("читает исходные хэши пачкой через двоичный протокол", () => {
    const buffers = unicodeSnapshot()
    const snapshot = snapshotView(buffers)
    const paths = [snapshot.filePath(0), "cf/Нет.yaml", snapshot.filePath(4)]
    const reader = openProjectStateReader(sectionViews(buffers))

    const actual = decodeRustFileBaselineResponse(
      reader.execute(encodeRustFileBaselineRequest(paths)),
    )

    expect(actual).toEqual([
      { status: "found", fileId: 0, hash: snapshot.fileRecord(0).hash },
      { status: "missing" },
      { status: "found", fileId: 4, hash: snapshot.fileRecord(4).hash },
    ])
    reader.close()
  })

  it("различает найденные, отсутствующие и неоднозначные цели", () => {
    const buffers = targetSnapshot()
    const snapshot = snapshotView(buffers)
    const expected = targetEntry(snapshot, "Catalog.Один")
    const reader = openProjectStateReader(sectionViews(buffers))

    const actual = decodeRustTargetResponse(reader.execute(encodeRustTargetRequest([
      { componentPath: "cf", canonicalTarget: "Catalog.Один" },
      { componentPath: "cf", canonicalTarget: "Catalog.Нет" },
      { componentPath: "cf", canonicalTarget: "Catalog.Два" },
    ])))

    expect(actual).toEqual([
      {
        status: "found",
        target: {
          kind: "object",
          sourceFileId: expected.sourceFileId,
          canonicalId: expected.canonicalId,
          componentPathId: expected.componentPathId,
        },
      },
      { status: "missing" },
      { status: "ambiguous" },
    ])
    reader.close()
  })

  it("сравнивает identity и хэш файлов и возвращает удалённые fileId", () => {
    const buffers = targetSnapshot()
    const snapshot = snapshotView(buffers)
    const reader = openProjectStateReader(sectionViews(buffers))

    const actual = decodeRustFileComparisonResponse(reader.execute(
      encodeRustFileComparisonRequest([
        {
          projectPath: snapshot.filePath(0),
          componentPath: snapshot.componentPath(0),
          hash: snapshot.fileRecord(0).hash,
          resourceKind: "yaml",
          yamlRole: "configuration",
        },
        {
          projectPath: "cf/Нет.yaml",
          componentPath: "cf",
          hash: 10n,
          resourceKind: "yaml",
          yamlRole: "configuration",
        },
      ]),
    ))

    expect(actual).toEqual({
      changed: [{ index: 1 }],
      deletedFileIds: [1, 2],
    })
    reader.close()
  })

  it("объединяет несколько доказательств одной файловой цели", () => {
    const buffers = fileBackedTargetSnapshot()
    const snapshot = snapshotView(buffers)
    const expected = targetEntry(snapshot, "Document.Заказ.Template.Печать")
    const reader = openProjectStateReader(sectionViews(buffers))

    const actual = decodeRustTargetResponse(reader.execute(encodeRustTargetRequest([{
      componentPath: "cf",
      canonicalTarget: "Document.Заказ.Template.Печать",
    }])))

    expect(actual).toEqual([{
      status: "found",
      target: {
        kind: "member",
        sourceFileId: expected.sourceFileId,
        canonicalId: expected.canonicalId,
        componentPathId: expected.componentPathId,
        itemProjectPathId: expected.itemProjectPathId,
        ownerProjectPathId: expected.ownerProjectPathId,
      },
    }])
    reader.close()
  })

  it.each([
    ["короткий заголовок", (sections: ProjectStateSections) => ({
      ...sections,
      header: sections.header.subarray(0, 16),
    })],
    ["неверная версия", (sections: ProjectStateSections) => {
      new DataView(sections.header.buffer, sections.header.byteOffset).setUint16(10, 6, true)
      return sections
    }],
    ["неверное число строк в каталоге", (sections: ProjectStateSections) => {
      const view = new DataView(sections.header.buffer, sections.header.byteOffset)
      view.setUint32(44, view.getUint32(44, true) + 1, true)
      return sections
    }],
    ["неверная ёмкость индекса", (sections: ProjectStateSections) => {
      new DataView(sections.lookups.buffer, sections.lookups.byteOffset).setUint32(24, 3, true)
      return sections
    }],
  ])("отклоняет повреждённый снимок: %s", (_name, corrupt) => {
    const sections = copiedSectionViews(unicodeSnapshot())
    expect(() => openProjectStateReader(corrupt(sections))).toThrowError(
      expect.objectContaining({ code: "PROJECT_STATE_INVALID_SNAPSHOT" }),
    )
  })

  it("различает неизвестную операцию и повреждённый запрос", () => {
    const reader = openProjectStateReader(sectionViews(unicodeSnapshot()))
    const unknown = encodeRustFileBaselineRequest([])
    new DataView(unknown.buffer).setUint16(8, 99, true)

    expect(() => reader.execute(unknown)).toThrowError(
      expect.objectContaining({ code: "PROJECT_STATE_UNKNOWN_OPERATION" }),
    )
    expect(() => reader.execute(new Uint8Array(4))).toThrowError(
      expect.objectContaining({ code: "PROJECT_STATE_INVALID_QUERY" }),
    )
    reader.close()
  })

  it("освобождает ссылки после явного закрытия", () => {
    const reader = openProjectStateReader(sectionViews(unicodeSnapshot()))
    reader.close()
    expect(() => reader.stats()).toThrow(/закрыт/u)
  })
})

function copiedSectionViews(
  buffers: ReturnType<typeof unicodeSnapshot>,
): ProjectStateSections {
  const sections = sectionViews(buffers)
  return {
    header: Uint8Array.from(sections.header),
    strings: Uint8Array.from(sections.strings),
    files: Uint8Array.from(sections.files),
    facts: Uint8Array.from(sections.facts),
    lookups: Uint8Array.from(sections.lookups),
    diagnostics: Uint8Array.from(sections.diagnostics),
  }
}

function targetEntry(
  snapshot: ReturnType<typeof snapshotView>,
  canonical: string,
) {
  const entry = Array.from(
    { length: snapshot.targetEntryCount },
    (_, entryId) => snapshot.targetEntry(entryId),
  ).find((candidate) => snapshot.stringValue(candidate.canonicalId) === canonical)
  if (entry === undefined) throw new Error(`Не найдена цель ${canonical}`)
  return entry
}
