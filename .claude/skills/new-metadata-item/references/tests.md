# Тесты `fromXML` / `toXML` / `fromYAML` / `toYAML`

Все 4 файла тестов создаются в каталоге нового объекта метаданных:

- `fromXML.test.ts` — включает **постоянный round-trip блок**
- `toXML.test.ts`
- `fromYAML.test.ts` — включает **постоянный round-trip блок**
- `toYAML.test.ts`

## Round-trip: зачем и как

Round-trip — это тест `import → export → сравнение с исходником`. Его роль двойная:

1. **Инструмент итеративной разработки.** На шаге 4 SKILL.md (`rules.ts` — первое приближение) агент пишет round-trip **первым**, до раздельных `fromXML`/`toXML`, и крутит цикл «прогон → diff → правка rules.ts» пока тест не станет зелёным.
2. **Постоянный регрессионный тест.** После завершения работы round-trip **остаётся** в `fromXML.test.ts` / `fromYAML.test.ts` — он ловит несимметричные поломки, которые раздельные `fromXML`/`toXML` пропускают.

### Сравнение для XML

Строковое, **без канонизации**. Источник истины — XML-фикстура; экспортированный XML должен совпасть с ней посимвольно.

### Сравнение для YAML

На уровне **parsed object** (распарсить оба YAML и сравнить через `toEqual`). Форматирование YAML (порядок ключей, отступы, кавычки, флоу vs блок) не семантично — сравнивать строкой бессмысленно.

## Протокол эскалации

Когда round-trip даёт расхождение, агент классифицирует его по **трём артефактам**:

```
source  --import-->  data (результат import)  --export-->  exported
```

| Где присутствует | Диагноз | Действие |
|------------------|---------|----------|
| source ✓, data ✗ | Потеря на импорте — нет правила или правило молча дропает | Известное свойство из брифа → **чинить сам** (добавить/поправить rule). Неизвестное → **спросить** |
| source ✓, data ✓, exported ✗ | Потеря на экспорте — rule не пишет | Известное свойство → **чинить сам**. Композит/ссылка → **спросить** |
| source ✓, data ✓, exported ✓, значения отличаются форматированием (`"true"` vs `"True"`, регистр, булева нормализация) | Трансформация | **Чинить сам** — стандартный трансформер |
| source ✓, data ✓, exported ✓, значения отличаются по смыслу (`"1"` vs `"2"`) | Смысловое искажение | **Спросить** пользователя |
| source ✗, exported ✓ | Лишнее на экспорте — rule пишет default | **Чинить сам** — убрать default или сделать условным |

### Правила эскалации

- **Сам чинит** без вопроса: отсутствие правила для свойства из брифа, форматные трансформации, лишние default-значения.
- **Спрашивает пользователя** одним сообщением со списком: неизвестные атрибуты/теги (нет в брифе и в схеме), любые расхождения в композитах/ссылках, смысловые искажения значений.
- **После 3 итераций без прогресса** — стоп, показать текущий diff пользователю, не продолжать молча.
- **Формат вопросов** — один блок, пронумерованный, для каждого пункта есть **предлагаемое решение**, пользователь либо подтверждает, либо правит.

## Шаблоны

### `fromXML.test.ts` (с round-trip)

```typescript
import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PropertyRule } from "~/metadata/orchestration"
import { full } from "~/metadata/commonObjects/<objectDir>/__fixtures__/full"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

const rule: PropertyRule = {
  type: "<PropertyType>",
}

describe("import <PropertyType> from XML", () => {
  it("imports full fixture", () => {
    const result = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "<XmlRootTag>",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(full)
  })

  it("round-trip: import → export совпадает с исходным XML", () => {
    const source = readFileSync(join(__dirname, "__fixtures__", "full.xml"), "utf-8")
    const imported = testImportPropertyFromXML({
      rule,
      path: "full.xml",
      xmlRootTag: "<XmlRootTag>",
      importMetaUrl: import.meta.url,
    })
    const { result } = testExportPropertyToXML({
      rule,
      value: imported,
      xmlRootTag: "<XmlRootTag>",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(source)
  })
})
```

### `toXML.test.ts`

```typescript
import { describe, expect, it } from "vitest"
import { full } from "~/metadata/commonObjects/<objectDir>/__fixtures__/full"
import { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToXML } from "~/tests/property/exportPropertyToXML"

describe("export<PropertyType>ToXML", () => {
  it("exports full.xml fixture", () => {
    const rule: PropertyRule = {
      type: "<PropertyType>",
    }
    const { expectedResult, result } = testExportPropertyToXML({
      rule,
      value: full,
      xmlRootTag: "<XmlRootTag>",
      path: "full.xml",
      importMetaUrl: import.meta.url,
    })
    expect(result).toEqual(expectedResult)
  })
})
```

### `fromYAML.test.ts` (с round-trip)

```typescript
import { parse } from "yaml"
import { describe, expect, it } from "vitest"
import { full, fullYAML } from "~/metadata/commonObjects/<objectDir>/__fixtures__/full"
import { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromYAML } from "~/tests/property/importPropertyFromYAML"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"

const rule: PropertyRule = { type: "<PropertyType>", yaml: "<YAMLSynonym>" }

describe("import<PropertyType>FromYAML", () => {
  it("imports undefined", () => {
    const result = testImportPropertyFromYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("imports fixture", () => {
    const result = testImportPropertyFromYAML({ rule, value: fullYAML })
    expect(result).toEqual(full)
  })

  it("round-trip: import → export даёт тот же YAML (parsed)", () => {
    const imported = testImportPropertyFromYAML({ rule, value: fullYAML })
    const exported = testExportPropertyToYAML({ rule, value: imported })
    // Сравнение на уровне распарсенного объекта — форматирование YAML не семантика.
    expect(exported).toEqual({ "<YAMLSynonym>": fullYAML })
  })
})
```

### `toYAML.test.ts`

```typescript
import { describe, expect, it } from "vitest"
import { full, fullYAML } from "~/metadata/commonObjects/<objectDir>/__fixtures__/full"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"

const rule: PropertyRule = {
  type: "<PropertyType>",
  yaml: "<YAMLSynonym>",
}

describe("export<PropertyType>ToYAML", () => {
  it("exports undefined", () => {
    const result = testExportPropertyToYAML({ rule, value: undefined })
    expect(result).toBeUndefined()
  })

  it("exports fixture", () => {
    const result = testExportPropertyToYAML({ rule, value: full })
    expect(result).toEqual({ "<YAMLSynonym>": fullYAML })
  })
})
```

## Чеклист перед запуском тестов

1. В `__fixtures__/` есть XML-файлы, используемые в `path`
2. Для каждой XML-фикстуры `<name>.xml` есть соседний `__fixtures__/<name>.ts` с экспортами `<name>` и (после YAML-цикла) `<name>YAML`
3. `rule.type` совпадает с зарегистрированным `propertyType` (реестры обновлены — шаг 5 SKILL.md)
4. `xmlRootTag` совпадает с корневым XML-тегом фикстуры
5. Пути импорта используют алиас `~/...`