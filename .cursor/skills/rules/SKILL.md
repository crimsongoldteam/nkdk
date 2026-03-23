---
name: nakidka-core-rules
description: >-
  Устройство rules.ts и PropertyRule: MetadataItemRule, BasePropertyRule, yaml/xml/xmlParents,
  специализированные типы (I8nText — как в коде API, SystemEnumeration, SettingsParameterValue,
  ChildItems, Events). Читай при правках rules.ts и сериализации в packages/core/metadata.
  Обзор репозитория и имена файлов from*/to* — скил nakidka-core.
---

# Правила метаданных: `rules.ts` и `PropertyRule`

Соглашения об именах `fromXML` / `toXML` / DCS и структура монорепозитория — [nakidka-core](../nakidka-core/SKILL.md).

Файлы **`rules.ts`** в модулях `packages/core/metadata` описывают не бизнес-логику, а **декларативную карту полей** объекта метаданных для оркестрации: XML ↔ внутреннее представление ↔ YAML (и частично обмен с клиентом 1С для форм).

Источник истины по типам настроек: `packages/core/metadata/orchestration/property/types.ts` и реестр типов `packages/core/metadata/orchestration/property/registry.ts` (`PropertyRuleType`).

---

## Структура объекта правил

Экспорт из `rules.ts` — это **`MetadataItemRule`**: идентификатор вида объекта и словарь свойств.

```197:203:packages/core/metadata/orchestration/property/types.ts
export interface MetadataItemRule extends MetadataItem {
  itemType: MetadataItemType
  properties: PropertiesType

  // events?: EventsRules
  eventsTag?: string
}
```

- **`itemType`** — строка, согласованная с реестром метаданных (`metadataItem/registry.ts`).
- **`properties`** — объект **имя поля во внутреннем типе** (обычно camelCase) → **`PropertyRule`**.
- **`eventsTag`** (опционально) — тег группы событий в XML формы (см. например `clientApplicationForm/rules.ts`).

Ключ в `properties` задаёт имя свойства в TS-модели; **`xml`** / **`yaml`** переопределяют имена в файлах.

Поле **`type`** внутри правила — это **`PropertyRuleType`**: по нему оркестратор находит обработчики `importFromXML`, `exportToXML`, `importFromYAML`, `exportToYAML` и т.д. (см. `packages/core/metadata/orchestration/property/fn.ts`).

---

## Общие настройки: `BasePropertyRule`

```18:81:packages/core/metadata/orchestration/property/types.ts
export interface BasePropertyRule {
  type: PropertyRuleType

  required?: true

  /** Отключает свойство при любом экспорте/импорте */
  runtimeOnly?: true

  /**
   * Порядок свойств при экспорте/импорте.
   * Меньшее значение — раньше, отсутствие значения — после всех с order.
   */
  order?: number

  /**
   * Название ключа в yaml
   */
  yaml?: string

  /**
   * Не экспортировать в yaml
   */
  toYAML?: false
  /**
   * Не импортировать из yaml
   */
  fromYAML?: false
  toPartialYAML?: false
  defaultValueYAML?: any | DefaultValueFunction

  /**
   * Название в xml, если не заполнено - будет использован ключ
   */
  xml?: string
  defaultValueXML?: any
  fromXML?: false
  toXML?: false
  /**
   * Родительские элементы в xml
   */
  xmlParents?: string[]

  /**
   * Передавать значение в форму в 1С
   */
  toEnterprise?: false
  fromEnterprise?: false
  defaultValue?: any | DefaultValueFunction

  /**
   * Теги, по которым будет выгружаться свойство
   */
  tag?: string

  /**
   * Если все поля пустые - это поле будет выгружено как значение
   */
  useAsShortValueYAML?: true

  /**
   * Если true, то свойство будет пропущено при импорте из XML
   */
  forReferenceOnly?: true
}
```

| Поле | Смысл |
|------|--------|
| **`type`** | Вид сериализации и обработчик из реестра (`PropertyRuleType`). |
| **`required`** | Обязательное свойство. |
| **`runtimeOnly`** | Не участвует в импорте/экспорте файлов (только рантайм редактора). |
| **`order`** | Порядок при сериализации: меньше — раньше; без `order` — после всех с номером. |
| **`yaml`** | Ключ в YAML (часто русское имя как в 1С). |
| **`toYAML` / `fromYAML`** | `false` — не писать в YAML / не читать из YAML. |
| **`toPartialYAML`**, **`defaultValueYAML`** | Частичный YAML и значения по умолчанию при экспорте в YAML. |
| **`xml`** | Имя в XML; если не задано — используется ключ свойства. |
| **`defaultValueXML`**, **`fromXML` / `toXML`** | Умолчание для XML и отключение одного направления. |
| **`xmlParents`** | Цепочка родительских элементов XML, под которыми лежит поле. |
| **`toEnterprise` / `fromEnterprise`** | Участие в обмене с формой 1С (`false` — не туда/не оттуда). |
| **`defaultValue`** | Значение по умолчанию или функция `(context, name?) => …`. |
| **`tag`** | Теги для сценариев выгрузки по группам. |
| **`useAsShortValueYAML`** | Короткая форма YAML: при пустых прочих полях значение уходит как скаляр/краткая запись. |
| **`forReferenceOnly`** | При импорте из XML свойство пропускается (служебные: uuid, internalInfo и т.п.). |

---

## Специализированные правила (дополнительные поля)

### Дочерние элементы форм

`GroupChildItems`, `CommandBarChildItems`, `TableChildItems`, `PagesChildItems`:

```83:87:packages/core/metadata/orchestration/property/types.ts
export interface ChildItemsPropertyRule extends BasePropertyRule {
  type: "GroupChildItems" | "CommandBarChildItems" | "TableChildItems" | "PagesChildItems"
  defaultValue: []
  fromPartialYAML?: true
}
```

### Видимость пользователю

`UserVisible` — два обязательных ключа YAML (разрешить / запретить):

```89:93:packages/core/metadata/orchestration/property/types.ts
export interface UserVisiblePropertyRule extends BasePropertyRule {
  type: "UserVisible"
  yaml: string
  yamlDeny: string
}
```

### Стандартные реквизиты

`StandardAttributeDescription`, `StandardAttributeDescriptions` — поле **`standartAttributeNames`**: какие стандартные атрибуты входят в блок.

### События

`Events` — карта **ключ в metadata → ключ в YAML** (русские подписи):

```105:112:packages/core/metadata/orchestration/property/types.ts
export interface EventsPropertyRule extends BasePropertyRule {
  type: "Events"
  /**
   * Маппинг: ключ события в metadata -> ключ в YAML (русский синоним).
   * Пример: onChange -> "ПриИзменении"
   */
  items: Record<string, string>
}
```

### Табличный дополнительный источник

`TableAdditionalSource` — **`additionalSourceType`**, опционально **`forSingleElement`**.

### Описание типа

`TypeDescription` — опционально **`addTypeDescriptionAttributeToXML`**.

### Путь к данным

`DataPath` — **`defaultType`**.

### Ссылка на тип метаданных

`MetadataType`, `MetadataTypeCollection` — **`typeValue`**.

### Внутренняя информация

`InternalInfo` — **`items`** (шаблоны имён/категорий), обычно с **`forReferenceOnly`**, опционально **`getName`** для имени при экспорте в XML.

### Системное перечисление

`SystemEnumeration` — **`typeSE`**: ключ из `SystemEnumerationTypeMap` в `systemEnumerations/types.ts`; **`defaultValueYAML`** типизирован под конкретное перечисление.

### Значение метаданных

`MetadataValue` — опционально **`valueType`**, **`exportNilValue`**, **`withType`** (тонкая настройка XML: `xsi:type`, nil).

### Параметр настроек СКД

`SettingsParameterValue` — правило для `dcsset:SettingsParameterValue`:

```14:23:packages/core/metadata/commonObjects/dataCompositionSystem/parameterValue/types.ts
/**
 * Правило свойства для `dcsset:SettingsParameterValue` (расширение `dcscore:ParameterValue` в XSD).
 * Базовый `ParameterValue` в реестре свойств не регистрируется — только этот тип.
 */
export interface SettingsParameterValuePropertyRule extends BasePropertyRule {
  type: "SettingsParameterValue"
  valueType: DcsMetadataValueValueType
  /** Для `SystemEnumeration` — ключ из `SystemEnumerationTypeMap`. */
  typeSE?: keyof SystemEnumerationTypeMap
}
```

### Многоязычный текст

`I8nText` (в коде и папке `i8nText` намеренно без «18») — **`yamlPartialOthers`**, **`skipEmptyToXML`**, **`excludeIfEqualNameYAML`** (не выгружать синоним в YAML, если совпадает с именем элемента в PascalCase):

```29:38:packages/core/metadata/commonObjects/i8nText/types.ts
export interface I8nTextPropertyRule extends Omit<BasePropertyRule, "defaultValue"> {
  type: "I8nText"
  yamlPartialOthers?: true
  skipEmptyToXML?: true

  /**
   * Если значение поля приведенное к pascalCase равно имени элемента - поле не будет выгружено в yaml
   */
  excludeIfEqualNameYAML?: true
  defaultValue?: I8nText | I8nTextDefaultValueFunction
}
```

### Форматированный многоязычный текст

`FormattedI8nText` — **`yamlFormatted`**, **`xmlWithDefaultLanguage`**, **`yamlPartialOthers`**.

---

## Список значений `type` (`PropertyRuleType`)

Полный перечень ключей реестра — в `packages/core/metadata/orchestration/property/registry.ts`: константа **`PropertyRuleTypeKeys`** (примитивы, `SystemEnumeration`, контейнеры форм, объекты метаданных, СКД `Filter`, `AppearanceFields`, …). Для каждого типа там задано соответствие представлениям `item` / `yaml` / `enterprise`.

---

## Практика при изменениях

1. Обновить **`types.ts`** объекта.
2. Добавить или поправить запись в **`rules.ts`**: `type`, при необходимости `yaml`, `xml`, `xmlParents`, `defaultValueXML`, флаги каналов.
3. Если поведение не укладывается в существующий `type` — смотреть обработчики в реестре и в модуле типа, а не обходить это только флагами в одном `rules.ts`.

## Связанные скилы

- [nakidka-core](../nakidka-core/SKILL.md) — монорепозиторий, домен `metadata`, пайплайн XML/YAML
- [tests/](../tests/SKILL.md) — тесты после изменений в `rules.ts`
- [core-xml-reference-tests](../core-xml-reference-tests/SKILL.md) — порядок узлов в toXML (связь с **`forReferenceOnly`** в правиле см. там)
