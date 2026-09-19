import { createHash } from "node:crypto"
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { relative, resolve } from "node:path"
import {
  createConfigurationLanguages,
  parseXmlDocumentWithSaxes,
  xmlElementChildren,
  type ConfigurationContextFromXML,
  type XmlElementNode,
} from "@nkdk/runtime"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { importTypeDescriptionFromXML } from "../../../packages/rules/metadata/commonObjects/typeDescription/fromXML"
import { exportTypeDescriptionToYAML } from "../../../packages/rules/metadata/commonObjects/typeDescription/toYAML"

type Frame = { name: string; start: number; openEnd: number; hasType: boolean }

const context: ConfigurationContextFromXML = {
  version: "2.20",
  languages: createConfigurationLanguages({ default: "ru", registered: ["ru", "en"] }),
  testMode: true,
  exportToYAML: { toTyped: false },
  fromXML: {},
}
const rule: PropertyRule = { yaml: "Шапка", type: "string" }

const parseStructuralXml = (source: string): XmlElementNode => {
  const root = parseXmlDocumentWithSaxes(source).roots[0]
  if (root === undefined) throw new Error("Тестовый XML должен содержать корневой элемент")
  const nodes = [root]
  for (const node of nodes) {
    nodes.push(...xmlElementChildren(node))
    Object.defineProperty(node, "compatibilityValue", {
      get() { throw new Error("Compatibility XML must not be read") },
    })
  }
  return root
}

const root = resolve(import.meta.dirname, "../../..")
const fixtureRoot = resolve(root, "e2e/fixtures/xml")
const output = resolve(root, "tests/migration/type-description-e2e.json")
const files: string[] = []
const visit = (path: string) => {
  for (const name of readdirSync(path)) {
    const child = resolve(path, name)
    if (statSync(child).isDirectory()) visit(child)
    else if (name.endsWith(".xml")) files.push(child)
  }
}
visit(fixtureRoot)

const cases: unknown[] = []
const seen = new Set<string>()
for (const path of files.sort()) {
  const source = readFileSync(path, "utf8")
  const namespaces = new Map<string, string>()
  for (const match of source.matchAll(/xmlns:([A-Za-z_][\w.-]*)=["']([^"']+)["']/g)) namespaces.set(match[1]!, match[2]!)
  const declarations = [...namespaces].map(([prefix, uri]) => ` xmlns:${prefix}="${uri.replaceAll("&", "&amp;").replaceAll('"', "&quot;")}"`).join("")
  const stack: Frame[] = []
  const tokens = /<!\[CDATA\[[\s\S]*?\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<![^>]*>|<\/?[A-Za-z_][\w.:-]*(?:\s[^<>]*?)?\/?>/g
  for (const match of source.matchAll(tokens)) {
    const token = match[0]
    if (token.startsWith("<!") || token.startsWith("<?")) continue
    const closing = token.startsWith("</")
    const name = token.match(/^<\/?([^\s/>]+)/)?.[1]
    if (!name) continue
    if (!closing) {
      if (["v8:Type", "v8:TypeSet", "v8:TypeId"].includes(name) && stack.length) stack.at(-1)!.hasType = true
      if (!token.endsWith("/>")) stack.push({ name, start: match.index!, openEnd: match.index! + token.length, hasType: false })
      continue
    }
    const frame = stack.pop()
    if (!frame || frame.name !== name || !frame.hasType) continue
    const original = source.slice(frame.start, match.index! + token.length)
    const opening = source.slice(frame.start, frame.openEnd)
    const attributes = opening.slice(1 + frame.name.length, -1)
    const inner = source.slice(frame.openEnd, match.index!)
    const standalone = `<Type${declarations}${attributes}>${inner}</Type>`
    const wrapped = `<Root${declarations}><Type${attributes}>${inner}</Type></Root>`
    const key = createHash("sha256").update(wrapped).digest("hex")
    if (seen.has(key)) continue
    seen.add(key)
    let yaml: unknown
    let legacyError: string | undefined
    try {
      const value = importTypeDescriptionFromXML(context, rule, parseStructuralXml(standalone))
      yaml = exportTypeDescriptionToYAML(context, rule, value)
    } catch (error) {
      legacyError = error instanceof Error ? error.message : String(error)
    }
    cases.push({
      source: relative(root, path), sourceSha256: createHash("sha256").update(source).digest("hex"),
      start: Buffer.byteLength(source.slice(0, frame.start)), original, xml: wrapped, yaml: yaml ?? null, ...(legacyError ? { legacyError } : {}),
    })
  }
}
writeFileSync(output, `${JSON.stringify({scope:"TypeDescription contents from immutable e2e XML fixtures",cases}, null, 2)}\n`)
console.log(JSON.stringify({files:files.length,cases:cases.length}))
