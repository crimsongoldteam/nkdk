import { readFile, readdir, writeFile } from "node:fs/promises"
import { relative, resolve, sep } from "node:path"

const metadataDir = resolve(import.meta.dirname, "../../metadata")
const outputPath = resolve(metadataDir, "ruleOrderAnalysis/catalogImports.generated.ts")
const files = []
for (const filePath of await findRuleFiles(metadataDir)) {
  if (/\bexport\b/.test(await readFile(filePath, "utf8"))) files.push(filePath)
}
const lines = files.flatMap((filePath, index) => {
  const relativePath = relative(resolve(metadataDir, "ruleOrderAnalysis"), filePath).split(sep).join("/")
  return [`import * as rules${index} from ${JSON.stringify(relativePath)}`]
})
lines.push(
  "",
  "export const runtimeRuleOrderModules = [",
  ...files.map((filePath, index) => {
    const metadataRelativePath = relative(metadataDir, filePath).split(sep).join("/")
    return `  { metadataRelativePath: ${JSON.stringify(metadataRelativePath)}, exports: rules${index} },`
  }),
  "] as const",
  ""
)
await writeFile(outputPath, lines.join("\n"), "utf8")

async function findRuleFiles(directory) {
  const result = []
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((left, right) =>
    Buffer.compare(Buffer.from(left.name), Buffer.from(right.name))
  )) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) result.push(...(await findRuleFiles(path)))
    else if (entry.isFile() && entry.name === "rules.ts") result.push(path)
  }
  return result
}
