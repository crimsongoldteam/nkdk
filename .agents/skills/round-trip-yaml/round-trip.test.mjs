import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const skill = await readFile(new URL("./SKILL.md", import.meta.url), "utf8")
const script = await readFile(new URL("./round-trip.sh", import.meta.url), "utf8")

test("проверяет только активный XML-каталог, а не рабочее дерево nkdk", () => {
  assert.doesNotMatch(script, /git -C "\$\{REPO_DIR\}" status/u)
  assert.match(script, /git -C "\$\{NKDK_XML_REPO\}" status --porcelain -- "\$\{RUN_XML_REL\}"/u)
})

test("не требует отсутствующих справочных файлов metadata", () => {
  assert.doesNotMatch(skill, /\.agents\/knowledge\/metadata/u)
})

test("запускает импорт и sync с четырьмя работниками", () => {
  const concurrencyValues = [...script.matchAll(/componentPath:"cf",concurrency:(\d+)/gu)]
    .map((match) => Number(match[1]))

  assert.deepEqual(concurrencyValues, [4, 4])
})
