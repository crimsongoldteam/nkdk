import { readFileSync } from "node:fs"
import { rootObjectDeclarations } from "./root-objects"
import type { ScenarioOperation } from "./types"

export type ExternalFileOperation = ScenarioOperation & {
  readonly payloadKind: "binary" | "rights-xml" | "ws-or-xdto"
}

const fixture = (path: string) => new URL(`../../fixtures/nkdk/cf/${path}`, import.meta.url)
const rightsPath = "Роль/Администратор/Rights.xml"
const rightsBefore = readFileSync(fixture(rightsPath), "utf8")
const rightsAfter = replaceOnce(rightsBefore, "<setForNewObjects>false</setForNewObjects>", "<setForNewObjects>true</setForNewObjects>")
const binaryPath = "Логотип/Picture.png"
const binaryBefore = new Uint8Array(readFileSync(fixture(binaryPath)))
const binaryAfter = new Uint8Array(readFileSync(fixture("ОбщаяКартинка/ОбщаяКартинкаОднаКартинка/Картинка/Picture.png")))
const wsRoot = rootObjectDeclarations.find(({ key }) => key === "object:ws-reference")
const wsChange = wsRoot?.changes.find(({ path }) => path.endsWith("/WSDefinition.xml"))
if (wsChange === undefined || typeof wsChange.after !== "string") throw new Error("Не найден WSDefinition.xml")
const wsAfter = replaceOnce(
  wsChange.after,
  '<soapbind:address location="http://example.org/partial-sync" />',
  '<soapbind:address location="http://example.org/partial-sync/changed" />',
)

export const externalFileOperations: readonly ExternalFileOperation[] = [
  operation("external:rights", "rights-xml", rightsPath, rightsBefore, rightsAfter),
  operation("external:binary", "binary", binaryPath, binaryBefore, binaryAfter),
  operation("external:ws", "ws-or-xdto", wsChange.path, wsChange.after, wsAfter),
]

export const externalFileRestoreOperations = externalFileOperations.toReversed().map((source): ExternalFileOperation => ({
  ...source,
  key: `${source.key}:restore`,
  changes: source.changes.map(({ path, before, after }) => ({ path, before: after, after: before })),
}))

function operation(
  key: string,
  payloadKind: ExternalFileOperation["payloadKind"],
  path: string,
  before: string | Uint8Array,
  after: string | Uint8Array,
): ExternalFileOperation {
  return { key, kind: "change", payloadKind, changes: [{ path, before, after }], dependsOn: [] }
}

function replaceOnce(source: string, before: string, after: string): string {
  const index = source.indexOf(before)
  if (index < 0 || source.indexOf(before, index + before.length) >= 0) throw new Error(`Не найден внешний фрагмент ${before}`)
  return `${source.slice(0, index)}${after}${source.slice(index + before.length)}`
}
