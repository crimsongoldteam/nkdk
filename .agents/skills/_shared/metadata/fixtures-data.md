# TS-фикстуры: одна на одну XML-фикстуру

Каждая XML-фикстура `__fixtures__/<name>.xml` имеет соседний TS-файл `__fixtures__/<name>.ts` с ожидаемым внутренним представлением объекта. Именно этот файл используется в `fromXML.test.ts` и `toXML.test.ts`.

## Конвенция именования

| Артефакт | Правило |
|----------|---------|
| XML-файл | `<name>.xml` |
| TS-файл | `<name>.ts` |
| TS-экспорт внутренней формы | `<name>` (camelCase, совпадает с именем файла) |
| TS-экспорт YAML-формы | `<name>YAML` |

`<name>` описывает фикстуру (`full`, `minimal`, `isFolderParentSwap`) — одно имя пронизывает файл, экспорт и соответствующее поле в тестах.

## Инструкция

0. Перед заполнением `<name>.ts` убедись, что `rules.ts` и `types.ts` уже созданы.
1. Построение объекта выполняй от типов: опирайся на `<ObjectName>` из `types.ts`, а не на произвольную структуру.
2. Заполни TS-фикстуру **только не-дефолтными полями** — теми, что **останутся в модели после импорта** (движок на импорте стрипит значения, совпавшие с `defaultValueXML`). Если в XML-фикстуре тег присутствует со значением-дефолтом (например, `<NumberType>String</NumberType>` при `defaultValueXML: "String"`), в TS его **не пиши** — иначе `expect(result).toEqual(<fixtureName>)` упадёт. Round-trip при этом остаётся корректным: на экспорте `defaultValueXML` пишется обратно, когда модель `undefined`. Комментарий по образцу `metadataCommand/__fixtures__/data.ts`: `// Corresponds to __fixtures__/<name>.xml (non-default values only, after import stripping)`.
3. Поля с `forReferenceOnly: true` (обычно `uuid`) в TS-фикстуру **не пиши** — они не попадают в модель в обычном режиме импорта. Для round-trip движок отдельно импортирует reference (`forReference: true`) и передаёт его в экспорт.
4. YAML-экспорт (`<name>YAML`) добавляется на YAML-цикле (шаг 11 `SKILL.md`), а не сразу.

## Пример

`__fixtures__/full.xml`:

```xml
<Filter>
  <use>true</use>
  <userSettingPresentation>MainSettings</userSettingPresentation>
</Filter>
```

`__fixtures__/full.ts`:

```typescript
import type { Filter, FilterYAML } from "../types"

export const full = {
  use: true,
  userSettingPresentation: "MainSettings",
} as const satisfies Filter

export const fullYAML = {
  Использование: "true",
  ПредставлениеПользовательскойНастройки: "ОсновныеНастройки",
} as const satisfies FilterYAML
```

Импорт в тесте:

```typescript
import { full } from "./__fixtures__/full"
```

## Миграция старых `data.ts`

Объекты метаданных, ещё использующие единый `__fixtures__/data.ts` с экспортами `fixture<ObjectName>` / `fixture<ObjectName>YAML`, **не переписываются насильно**. Новая конвенция применяется только к новым фикстурам; старые мигрируют естественно при очередной правке файла.
