# YAML-ссылки metadataTarget

## Статус

Черновик для ревью.

## Проблема

После импорта `/home/nikita/git/round-trip/erp` в YAML валидация показывает большую группу ошибок, где свойство является ссылкой на метаданные, но значение записано в модельной/платформенной форме.

Главный пример — ссылка на форму текущего документа:

```yaml
ОсновнаяФормаОбъекта: Document.АвансовыйОтчет.Form.ФормаДокумента
```

В YAML это должно быть локальное значение:

```yaml
ОсновнаяФормаОбъекта: ФормаДокумента
```

Причина не в специальной красоте YAML, а в том, что правило свойства уже должно описывать допустимое множество значений: «можно выбрать члена текущего объекта, и этот член должен быть формой». Если владелец и вид члена однозначно заданы правилом, их можно восстановить при импорте YAML и не хранить в YAML-строке.

Сейчас контракт разорван:

- `localChild` описывает формы и макеты как отдельный `kind`, хотя по сути это члены текущего объекта.
- `field` описывает только часть членов объекта: реквизиты, табличные части, измерения, ресурсы.
- `styleItem` и `commonPicture` выделены отдельными `kind`, хотя это верхнеуровневые объекты проекта с дополнительными ограничениями.
- старый `allowedValues: cypherSet(...)` умеет описать множество допустимых значений, например Boolean-реквизиты текущего объекта, но делает это сырым Cypher-запросом в `rules.ts`.
- строковые свойства `type: "string"` с `metadataTarget` не проходят через общий metadataTarget formatter/parser.

## Цели

- Описывать в `metadataTarget` не способ отображения, а множество допустимых целей: откуда выбираем, какие виды членов разрешены, какие фильтры применяются.
- Хранить в модели канонический путь: `Document.АвансовыйОтчет.Form.ФормаДокумента`, `DocumentNumerator.ДенежныеДокументы`, `Role.Администратор`.
- В YAML опускать только те сегменты, которые однозначно следуют из `metadataTarget` и контекста текущего объекта.
- Заменить `localChild` общим описанием членов объекта.
- Постепенно убрать частные `styleItem`/`commonPicture` в пользу `object` с фильтрами.
- Сохранить возможность выражать старый `allowedValues` без сырого Cypher в `rules.ts`.

## Не цели

- Не менять XML import/export и XML-фикстуры.
- Не чинить в этой задаче другие группы валидации: `DataPath` с `~...`, колонки динамического списка, неизвестные импортированные сегменты объектов.
- Не переписывать graph import.
- Не добавлять индивидуальные fromYAML/toYAML-правила в applied objects, если поведение можно выразить через `metadataTarget`.

## Основное решение

Разделить metadata-ссылки на три базовых вида:

```ts
type MetadataTargetConstraint =
  | ObjectTargetConstraint
  | MemberTargetConstraint
  | ValueTargetConstraint
  | TypeTargetConstraint
  | DataPathTargetConstraint
```

`object` — верхнеуровневый или вложенный объект метаданных проекта:

```ts
{
  kind: "object",
  roots: ["Role"]
}
```

`member` — именованный член объекта-владельца:

```ts
{
  kind: "member",
  owner: "this",
  memberKinds: ["Form"]
}
```

`value` — именованное значение внутри объекта метаданных:

```ts
{
  kind: "value",
  roots: ["Enum"],
  valueKinds: ["enumValue"]
}
```

`type` и `dataPath` остаются отдельными, потому что они описывают не обычную адресуемую metadata-ссылку, а описание типа и путь к данным формы.

## Member Target

`member` заменяет текущие `field` и `localChild`.

```ts
type MetadataMemberKind =
  | "Attribute"
  | "StandardAttribute"
  | "TabularSection"
  | "Dimension"
  | "Resource"
  | "Form"
  | "Template"
  | "Command"

interface MemberTargetConstraint {
  kind: "member"
  owner: "this" | "explicit"
  roots?: readonly MetadataRootName[]
  memberKinds?: readonly MetadataMemberKind[]
  filters?: readonly MetadataTargetFilter[]
  allowOwner?: boolean
}
```

`owner: "this"` означает, что цель выбирается среди членов текущего объекта. Например, для документа `АвансовыйОтчет` правило:

```ts
{
  kind: "member",
  owner: "this",
  memberKinds: ["Form"]
}
```

допускает канонический путь:

```text
Document.АвансовыйОтчет.Form.ФормаДокумента
```

и YAML-значение:

```text
ФормаДокумента
```

Преобразование выводится из ограничения:

- `owner: "this"` позволяет убрать `Document.АвансовыйОтчет`;
- единственный `memberKind: "Form"` позволяет убрать `Form`;
- оставшееся локальное имя восстанавливается как `<owner>.Form.<name>`.

Если разрешено несколько `memberKinds`, вид члена должен остаться в YAML:

```ts
{
  kind: "member",
  owner: "this",
  memberKinds: ["Form", "Template"]
}
```

```yaml
Форма.ФормаДокумента
Макет.ПечатнаяФорма
```

Сегменты `Форма` и `Макет` здесь являются YAML-именами для модельных `Form` и `Template`, так же как `Реквизит` является YAML-именем для `Attribute`.

`owner: "explicit"` означает, что владелец должен быть указан в YAML-строке:

```yaml
Документ.АвансовыйОтчет.Реквизит.Организация
```

Это нужно для ссылок на члены чужого объекта.

## Object Target

`object` описывает выбор объектов проекта:

```ts
{
  kind: "object",
  roots: ["DocumentNumerator"]
}
```

Модель хранит:

```text
DocumentNumerator.ДенежныеДокументы
```

YAML пишет:

```text
НумераторДокументов.ДенежныеДокументы
```

`commonPicture` становится обычным `object`:

```ts
{
  kind: "object",
  roots: ["CommonPicture"]
}
```

`styleItem` тоже становится `object`, но с фильтром:

```ts
{
  kind: "object",
  roots: ["StyleItem"],
  filters: [{ kind: "styleItemType", values: ["Color"] }]
}
```

Сокращение корня вроде `Role.Администратор -> Администратор` не должно появляться из `object` автоматически. Если такое сокращение нужно, оно должно быть отдельным договором для конкретного типа ссылок на роли и мигрироваться отдельно от исправления `member`.

## Filters

Фильтры должны заменить сырой `allowedValues: cypherSet(...)` там, где можно выразить правило типизированно.

Первый набор фильтров:

```ts
type MetadataTargetFilter =
  | { kind: "hasType"; type: MetadataTypeFilterValue }
  | { kind: "styleItemType"; values: readonly ("Color" | "Font" | "Border")[] }
  | { kind: "stringIndexedAttribute" }
```

Старый пример из `metadataAttribute/rules.ts`:

```ts
allowedValues: cypherSet({
  query:
    "MATCH (s {id: $scope})-[:ATTRIBUTE]->(a:MetadataAttribute)-[:TYPE]->(:Type {name: 'Boolean'}) RETURN a.name AS name",
})
```

становится:

```ts
metadataTarget: {
  kind: "member",
  owner: "this",
  memberKinds: ["Attribute"],
  filters: [{ kind: "hasType", type: "boolean" }]
}
```

Фильтр описывает предметное ограничение, а не способ получения значений. Validate может реализовать его через граф, индекс YAML или другой resolver, но `rules.ts` не должен знать Cypher.

У каждого фильтра есть два потребителя:

- `validate` применяет фильтр к найденным кандидатам. Для `hasType` это означает: получить модель владельца, перебрать его членов, прочитать `TypeDescription` у кандидата и проверить, содержит ли тип указанное значение.
- JSON Schema / ИИ получают текстовое описание фильтра. Для `hasType("boolean")`: «допустимы только реквизиты, тип которых содержит Булево». Это описание добавляется в `description`; сама JSON Schema продолжает проверять только форму строки.

Фильтр можно записывать через фабрику для удобства:

```ts
filters: [hasType("boolean")]
```

но фабрика должна возвращать данные:

```ts
{ kind: "hasType", type: "boolean" }
```

Исполняемая логика фильтра живёт в централизованном registry/resolver-слое metadata validation, а не в `rules.ts` и не в orchestration.

## YAML-форма

Отдельного `presentation` нет.

YAML-форма выводится из того, какие сегменты пути уже заданы ограничением:

- если `object.roots` содержит один root, root всё равно пишется в YAML как русское имя, кроме специально оговорённых совместимых сокращений;
- если `member.owner === "this"`, владелец убирается;
- если `member.memberKinds` содержит один вид, вид члена убирается;
- если `member.memberKinds` содержит несколько видов, вид члена остаётся;
- если `member.owner === "explicit"`, владелец остаётся.

Разбор YAML выполняет обратную операцию и восстанавливает канонический модельный путь.

## Ошибки

- Если для `owner: "this"` нет контекста текущего объекта, import/export должен падать с ошибкой настройки.
- Если модельное значение не попадает в заданный `memberKinds` или `filters`, export должен падать, а validate должен показывать ошибку свойства.
- Если YAML опустил сегмент, который нельзя восстановить однозначно, validate должен требовать более полный путь.
- Совместимый разбор старого полного `Document.АвансовыйОтчет.Form.ФормаДокумента` допустим на import, но export должен нормализовать значение до новой YAML-формы.

## Тестирование

Нужны тесты в трёх слоях:

- `metadataTargets`: parse/format для `member` с `owner: "this"`, одним `memberKind`, несколькими `memberKinds`, `owner: "explicit"` и фильтрами.
- property orchestration: `type: "string"` с `metadataTarget` проходит через metadataTarget formatter/parser.
- applied object sample: свойство документа/отчёта/справочника с `ОсновнаяФорма...` экспортируется в короткий YAML и импортируется обратно в канонический путь модели.

Регрессионная проверка:

```bash
pnpm test
packages/cli/bin/nkdk import /home/nikita/git/round-trip/erp /home/nikita/git/temp-yaml
packages/cli/bin/nkdk validate /home/nikita/git/temp-yaml
```

Первый ожидаемый эффект — исчезновение form/template части ошибок `строка не соответствует шаблону имени`.

## Открытые решения

1. Как назвать новый `kind`: `member`, `child`, `path` или иначе.
2. Нужен ли `allowOwner` для случаев, где ссылка может быть как на объект, так и на его член.
3. Оставлять ли `roleReferenceYAML: "name"` временно или переносить в новый механизм отдельной задачей.
