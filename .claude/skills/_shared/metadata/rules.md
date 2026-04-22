# Работа с правилами

Правила хранятся в файле `rules.ts` в каталоге объекта метаданных и состоят из имени объекта метаданных и описания свойств метаданных.

## Инструкция

0. Для создания правил потребуются эталонный XML-файл с заполненными полями, файл ресурсов (.res) с описаниями всех свойств и типов и список свойств (с их YAML-синонимами).
1. Создай новый `rules.ts` в каталоге объекта метаданных.
2. Заполни `rules.ts` ключами из списка свойств. Укажи для каждого ключа YAML-название.
3. Найди свойства с подобными названиями в файле ресурсов и если их название отличается от ключа, укажи это в параметре `xml`. Если не можешь сопоставить, спроси у пользователя.
4. Проверь есть ли в XML-файле свойства которые не включены в правила, нет в значениях параметра xml или ключей в правилах в случае если xml не указан. Если есть, спроси у пользователя что с ними делать.
5. Для каждого свойства найди соответствующий тип в `PropertyTypeRegistry` (`packages/core/metadata/orchestration/property/registry.ts`). Если тип не найден, спроси у пользователя что делать.

## Шаблон правил

```typescript
export const <ObjectName>Rules = {
  itemType: "<ObjectName>",
  properties: {
    <tsKey>: {
      type: "<propertyType>",
    },
  },
} as const satisfies MetadataItemRule
```

## `xmlParents` — путь до родителя XML-тега

Каждое правило свойства читает XML по пути `xml[xmlParents[0]][xmlParents[1]]...[xmlKey]`, где `xml` — это то, что пришло в item-правило **после снятия `xmlRootTag`** (тестом или вызывающим кодом), а `xmlKey = rule.xml ?? capitalize(key)`.

**Top-level applied object.** Для структуры `MetaDataObject > DocumentNumerator > Properties > Name` (обёртка `<MetaDataObject>` снимается через `xmlRootTag: "MetaDataObject"`):

```typescript
const properties = ["DocumentNumerator", "Properties"]

uuid:  { type: "string", xml: "_uuid", forReferenceOnly: true, xmlParents: ["DocumentNumerator"] }  // DocumentNumerator/@uuid
name:  { type: "string", required: true,                        xmlParents: properties }            // DocumentNumerator/Properties/Name
```

**Вложенный объект.** Для `Order` внутри `<dcsset:order>` обёртка снимается `xmlRootTag: "dcsset:order"` — `xmlParents` на свойствах либо отсутствует, либо короткий.

## Поля со значениями по умолчанию: `default*`

В правиле встречаются четыре разных поля с похожими именами — смысл у них разный, путать нельзя.

| Поле | Когда применять | Что делает на import | Что делает на export |
|------|-----------------|----------------------|----------------------|
| `defaultValueXML` | Значение-дефолт XML из схемы (`<NumberType>String</NumberType>`), встречающееся в фикстурах явно | Значение, равное `defaultValueXML`, стрипится из модели → поле становится `undefined` | Если модель `undefined`, **пишет** `defaultValueXML` обратно в XML. Обеспечивает round-trip для минимальных фикстур с явными дефолтами |
| `defaultValueYAML` | Значение-дефолт в YAML | Значение, равное `defaultValueYAML`, стрипится из модели | Если модель `undefined`, **пишет** `defaultValueYAML` в YAML (только на YAML-цикле, шаг 11 и далее) |
| `defaultValue` | Дефолт **в самой модели** — должен жить в in-memory представлении всегда | Заполняет `undefined` → `defaultValue` на любой операции | Не то же самое, что `defaultValueXML`: может привести к записи дефолта даже когда фикстура его не содержала |
| `defaultValueXMLRaw` | Raw-строка для «пустых тегов» из фикстуры (`<Synonym/>`, `<Comment/>`, `<ToolTip/>`, `<Picture/>`) | — | Когда значение в модели `undefined`, пишется raw-строка (обычно `""` → `<Synonym/>`). Без этого round-trip фикстуры с пустым тегом ломается: экспорт просто пропускает тег |

**Ведущее правило:** если round-trip фикстуры содержит значение-дефолт **явно** — используй `defaultValueXML`, **не** `defaultValue`. Иначе round-trip «добавит» или «уберёт» тег и сломается.

**Канонические примеры `defaultValueXMLRaw: ""`** (встречаются повсеместно в `metadataCatalog`/`metadataDocument`/`metadataCommand`):

```typescript
synonym: { yaml: "Синоним", type: "I8nText", xmlParents: ..., defaultValueXMLRaw: "" },
comment: { yaml: "Комментарий", type: "string", xmlParents: ..., defaultValueXMLRaw: "" },
```

## Примитивы → представление в YAML

YAML-форма отличается от XML-формы и от внутренней:

- **`boolean`** → `StringboolYAML` (`"Истина"` / `"Ложь"`), **не** `"true"` / `"false"`. См. `commonObjects/boolean/types.ts`.
- **`number`** → `number` (как есть).
- **`string`** → `string` (как есть).
- **`SystemEnumeration`** → русское имя из `<TypeSE>ToYAML`-маппинга (`DocumentNumberType.Number → "Число"`, `AllowedLength.Variable → "Свободная"`). Смотри `systemEnumerations/types.ts`.
- **`I8nText`** → либо строка (если в `items` только один язык и он совпадает с `defaultLanguage = "ru"`), либо `Record<lang, string>`. См. `commonObjects/i8nText/toYAML.ts`.

## Что `rules.ts` содержит на шаге 4 vs на шаге 11

На шаге 4 (XML-цикл, до жёсткого барьера) `rules.ts` **уже** содержит:

- английские TS-ключи свойств (`numberType`, `checkUnique`);
- поле `yaml: "..."` — **русское имя** синонима (`"ТипНомера"`, `"КонтрольУникальности"`). Это имя, часть структуры правила;
- `itemType`, `itemTypePrefix`;
- XML-аннотации: `xml`, `xmlParents`, `defaultValueXML`, `defaultValueXMLRaw`, `forReferenceOnly`, `required`.

На шаге 4 **не** пишем YAML-поведенческих аннотаций: `defaultValueYAML`, `toYAML: false`, `fromYAML: false`, `excludeIfEqualNameYAML`, `useAsShortValueYAML`. Эти значения собираются в брифе (шаг 1) «в память» агента и добавляются в `rules.ts` на шаге 11 (YAML-цикл).
