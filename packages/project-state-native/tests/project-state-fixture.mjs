import { buildProjectStateSnapshot } from "../../rules/metadata/projectState/binary/builder.ts"
import {
  createProjectStateFragmentWriter,
  openProjectStateFragment,
} from "../../rules/metadata/projectState/binary/fragment.ts"
import { ProjectStateSnapshotView } from "../../rules/metadata/projectState/binary/snapshot.ts"
import { resourceUpdate, yamlUpdate } from "../../rules/metadata/projectState/binary/testData.ts"

export function unicodeSnapshot() {
  const writer = createProjectStateFragmentWriter()
  for (const [index, name] of ["Я", "ё", "e\u0301", "😀", "𐐷"].entries()) {
    writer.appendFile(yamlUpdate(`cf/${name}.yaml`, "cf", `Catalog.${name}`), BigInt(index + 1))
  }
  return buildProjectStateSnapshot({
    fragments: [openProjectStateFragment(writer.finish())],
    deletions: [],
  })
}

export function targetSnapshot() {
  const writer = createProjectStateFragmentWriter()
  writer.appendFile(yamlUpdate("cf/Один.yaml", "cf", "Catalog.Один"), 1n)
  writer.appendFile(yamlUpdate("cf/ДваА.yaml", "cf", "Catalog.Два"), 2n)
  writer.appendFile(yamlUpdate("cf/ДваБ.yaml", "cf", "Catalog.Два"), 3n)
  return buildProjectStateSnapshot({
    fragments: [openProjectStateFragment(writer.finish())],
    deletions: [],
  })
}

export function fileBackedTargetSnapshot() {
  const writer = createProjectStateFragmentWriter()
  const target = {
    kind: "member",
    canonical: "Document.Заказ.Template.Печать",
    fileBacked: {
      itemProjectPath: "cf/Макеты/Печать",
      ownerProjectPath: "cf/Свойства.yaml",
    },
  }
  writer.appendFile({
    ...resourceUpdate("cf/Макеты/Печать/Template.xml"),
    targets: [target],
  }, 1n)
  writer.appendFile({
    ...resourceUpdate("cf/Макеты/Печать/Ext/logo.png"),
    targets: [target],
  }, 2n)
  return buildProjectStateSnapshot({
    fragments: [openProjectStateFragment(writer.finish())],
    deletions: [],
  })
}

export function snapshotView(buffers) {
  return new ProjectStateSnapshotView(buffers)
}

export function sectionViews(buffers) {
  return {
    header: new Uint8Array(buffers.header),
    strings: new Uint8Array(buffers.strings),
    files: new Uint8Array(buffers.files),
    facts: new Uint8Array(buffers.facts),
    lookups: new Uint8Array(buffers.lookups),
    diagnostics: new Uint8Array(buffers.diagnostics),
  }
}
