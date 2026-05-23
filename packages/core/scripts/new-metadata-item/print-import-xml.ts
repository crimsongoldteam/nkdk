import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import type { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"

const coreRoot = join(dirname(fileURLToPath(import.meta.url)), "../..")

const xmlPathRel = process.env.NKDK_METADATA_PRINT_XML_PATH
const wrapperTag = process.env.NKDK_METADATA_PRINT_XML_WRAPPER
const xmlRootTag = process.env.NKDK_METADATA_PRINT_XML_ROOT_TAG
const ruleJson = process.env.NKDK_METADATA_PRINT_RULE

if (!xmlPathRel || !wrapperTag || !xmlRootTag || !ruleJson) {
  throw new Error(
    [
      "Нужно задать переменные окружения:",
      "NKDK_METADATA_PRINT_XML_PATH",
      "NKDK_METADATA_PRINT_XML_WRAPPER",
      "NKDK_METADATA_PRINT_XML_ROOT_TAG",
      "NKDK_METADATA_PRINT_RULE",
    ].join("\n")
  )
}

const xmlInner = readFileSync(join(coreRoot, xmlPathRel), "utf-8")
const xmlString = `<${wrapperTag}>${xmlInner}</${wrapperTag}>`
const rule = JSON.parse(ruleJson) as PropertyRule
const forReference = process.env.NKDK_METADATA_PRINT_FOR_REFERENCE === "true"

const result = testImportPropertyFromXML({
  rule,
  xmlString,
  xmlRootTag,
  forReference,
})

// eslint-disable-next-line no-console
console.log(JSON.stringify(result, null, 2))
