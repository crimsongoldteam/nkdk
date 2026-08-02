import assert from "node:assert/strict"
import test from "node:test"
import {
  assertUsableTypeScript,
  readDepcruiseInfo,
} from "../src/run-depcruise.mjs"

test("принимает полный TypeScript 6 graph environment", () => {
  assert.doesNotThrow(() =>
    assertUsableTypeScript(`
✔ typescript             >=2.0.0 <7.0.0      typescript@6.0.3
✔ .ts
✔ .tsx
✔ .d.ts
`)
  )
})

test("отклоняет TypeScript 7 без публичного API", () => {
  assert.throws(
    () =>
      assertUsableTypeScript(
        "x typescript >=2.0.0 <7.0.0 -\nx .ts\nx .tsx\nx .d.ts"
      ),
    /TypeScript-парсер dependency-cruiser недоступен/u
  )
})

test("видит изолированный TypeScript при настоящем запуске", () => {
  assert.match(readDepcruiseInfo(), /typescript@6\.0\.3/u)
})
