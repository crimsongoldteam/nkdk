# IO-тесты прикладного объекта

Два IO-теста создаются в каталоге прикладного объекта:

- `convertFromXML.test.ts` — XML с диска → YAML на диск
- `syncToXML.test.ts` — YAML с диска → XML на диск

## Структура `__fixtures__/sync/`

```
<имя>/
  __fixtures__/
    sync/
      data.ts                    # экспорт readNameYAML — ожидаемая YAML-строка
      xml/<Имя>.xml              # исходный XML (reference для syncToXML)
      nkdk/<Имя>/
        Свойства.yaml            # входные данные для syncToXML
      out/                       # пустая, чистится в beforeEach
```

`out/` создаётся тестом динамически — в репозитории её не коммитить (добавь `.gitkeep` в `nkdk/` и `xml/`, но не в `out/`).

## Шаблон `data.ts`

```typescript
// Ожидаемое содержимое Свойства.yaml после convertAppliedObjectFromXML.
// Для объектов без YAML-свойств — пустая строка.
export const read<Name>YAML = "<ожидаемая yaml-строка>"
```

## Шаблон `convertFromXML.test.ts`

```typescript
import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { convertAppliedObjectFromXML } from "~/metadata/orchestration/appliedObject/convertFromXML"
import { mockContextFromXML } from "~/tests/mockContext"
import { read<Name>YAML } from "./__fixtures__/sync/data"
import { <MetadataName>Rules } from "./rules"

describe("convertAppliedObjectFromXML — <MetadataName>", () => {
  const inputDir = join(import.meta.dirname, "__fixtures__/sync/xml")
  const outputDir = join(import.meta.dirname, "__fixtures__/sync/out")
  const name = "<ИмяЭкземпляра>"

  beforeEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
  })

  it("читает <ТипОбъекта> из XML и записывает Свойства.yaml в outputDir", async () => {
    await convertAppliedObjectFromXML({
      rule: <MetadataName>Rules,
      context: mockContextFromXML(),
      inputDir,
      name,
      outputDir,
    })

    expect(fs.readFileSync(join(outputDir, name, "Свойства.yaml"), "utf-8")).toBe(read<Name>YAML)
  })
})
```

## Шаблон `syncToXML.test.ts`

```typescript
import fs from "fs"
import { join } from "path"
import { beforeEach, describe, expect, it } from "vitest"
import { syncAppliedObjectToXML } from "~/metadata/orchestration/appliedObject/syncToXML"
import { mockContextToXML } from "~/tests/mockContext"
import { <MetadataName>Rules } from "./rules"

describe("syncAppliedObjectToXML — <MetadataName>", () => {
  const fixturesDir = join(import.meta.dirname, "__fixtures__/sync")
  const inputDir = join(fixturesDir, "nkdk")
  const referenceDir = join(fixturesDir, "xml")
  const outputDir = join(fixturesDir, "out")
  const name = "<ИмяЭкземпляра>"

  beforeEach(() => {
    if (fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true })
    }
  })

  it("читает <ТипОбъекта> из YAML и записывает XML в outputDir", async () => {
    await syncAppliedObjectToXML({
      rule: <MetadataName>Rules,
      context: mockContextToXML(),
      inputDir,
      name,
      outputDir,
      referenceDir,
    })

    const expectedXML = fs.readFileSync(join(referenceDir, `${name}.xml`), "utf-8")
    const resultXML = fs.readFileSync(join(outputDir, `${name}.xml`), "utf-8")

    expect(resultXML).toBe(expectedXML)
  })
})
```

## Заполнение данных фикстур

**`xml/<Имя>.xml`** — XML-фикстура прикладного объекта. Бери готовый XML из реального конфигурационного репозитория или ту же фикстуру, что используется в round-trip тесте (`fromXML.test.ts`).

**`nkdk/<Имя>/Свойства.yaml`** — YAML-фикстура. Должна точно совпадать с тем, что генерирует `convertAppliedObjectFromXML` для данного XML. Заполни так: запусти `convertFromXML.test.ts`, скопируй вывод из `out/<Имя>/Свойства.yaml`.

**`data.ts`** — экспортирует ту же строку что в `Свойства.yaml`, для сравнения в тесте `convertFromXML.test.ts`. Пример:

```typescript
export const readCatalogYAML = "Синоним: Контрагенты справочник\n"
```

Если прикладной объект не имеет YAML-свойств (все свойства дефолтные), `data.ts` содержит пустую строку:

```typescript
export const readNumeratorYAML = ""
```
