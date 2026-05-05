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
      xml/<Имя>/Ext/...          # связанные модули и подпапки XML-источника
      nkdk/<Имя>/
        Свойства.yaml            # входные данные для syncToXML
        МодульОбъекта.bsl        # модули и команды (если объект их использует)
        МодульМенеджера.bsl
        Команды/<имя>.bsl
```

`out/` папки больше не создаются: helper'ы `testSyncAppliedObjectToXML` /
`testConvertAppliedObjectFromXML` пишут результат в уникальный `tmpdir`-каталог
через `fs.mkdtempSync`. В репозитории её нет, в `.gitignore` — `out/`.

## Шаблон `data.ts`

```typescript
// Ожидаемое содержимое Свойства.yaml после convertAppliedObjectFromXML.
// Для объектов без YAML-свойств — пустая строка.
export const read<Name>YAML = "<ожидаемая yaml-строка>"
```

## Шаблон `convertFromXML.test.ts`

```typescript
import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { read<Name>YAML } from "./__fixtures__/sync/data"
import { <MetadataName>Rules } from "./rules"

describe("convertAppliedObjectFromXML — <MetadataName>", () => {
  it("читает <ТипОбъекта> из XML и записывает Свойства.yaml в outputDir", async () => {
    const { yaml } = await testConvertAppliedObjectFromXML({
      rule: <MetadataName>Rules,
      name: "<ИмяЭкземпляра>",
      importMetaUrl: import.meta.url,
      expectedYAML: read<Name>YAML,
    })
    expect(yaml.result).toBe(yaml.expected)
  })
})
```

## Шаблон `syncToXML.test.ts`

```typescript
import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { <MetadataName>Rules } from "./rules"

describe("syncAppliedObjectToXML — <MetadataName>", () => {
  it("читает <ТипОбъекта> из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: <MetadataName>Rules,
      name: "<ИмяЭкземпляра>",
      importMetaUrl: import.meta.url,
      expectedFiles: ["<ИмяЭкземпляра>.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(result, path).toBe(expected)
    }
  })
})
```

`expectedFiles` — относительные пути от `xml/` (reference) и `outputDir`. Если
объект записывает дополнительные файлы (модули, подпапки `Ext/`, формы),
перечисли их по образцу `metadataCatalog/syncToXML.test.ts`.

## Заполнение данных фикстур

**`xml/<Имя>.xml`** — XML-фикстура прикладного объекта. Бери готовый XML из
реального конфигурационного репозитория или ту же фикстуру, что используется в
round-trip тесте (`fromXML.test.ts`).

**`nkdk/<Имя>/Свойства.yaml`** — YAML-фикстура. Должна точно совпадать с тем,
что генерирует `convertAppliedObjectFromXML` для данного XML. Заполни так:
запусти новый `convertFromXML.test.ts` с пустым `read<Name>YAML`, скопируй
фактический YAML из vitest-diff (или из `outputDir` через временный
`fs.cpSync` после теста) в `data.ts` и в `nkdk/<Имя>/Свойства.yaml`.

**`data.ts`** — экспортирует ту же строку что в `Свойства.yaml`, для сравнения
в тесте `convertFromXML.test.ts`. Пример:

```typescript
export const readCatalogYAML = "Синоним: Контрагенты справочник\n"
```

Если прикладной объект не имеет YAML-свойств (все свойства дефолтные),
`data.ts` содержит пустую строку:

```typescript
export const readNumeratorYAML = ""
```
