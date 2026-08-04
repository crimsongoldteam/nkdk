# Значения документа по умолчанию

## Цель

Привести `defaultValueXML` и `implicitValueYAML` правил `MetadataDocument` к
свойствам нового пустого документа, созданного Конфигуратором. Значения не
должны попадать в YAML как явные пользовательские настройки и должны точно
восстанавливаться в XML без reference.

## Источник истины и границы

Источником истины остаётся существующая XML-фикстура
`packages/core/metadata/appliedObjects/metadataDocument/__fixtures__/minimal.xml`.
Она совпадает с предоставленными снимками и не изменяется.

По аналогии с `MetadataCatalogRules`, обычный скалярный default задаётся
согласованной парой: `implicitValueYAML` описывает значение, которое можно не
записывать в YAML, а `defaultValueXML` восстанавливает то же значение в XML без
reference. `defaultValueXMLRaw` и неиспользуемый `metadataDocument/defaults.ts`
в этой задаче не изменяются.

## Изменение правил

У следующих свойств оба параметра получают новое значение:

| Свойство модели | Было | Станет |
| --- | --- | --- |
| `numberLength` | `11` | `9` |
| `numberPeriodicity` | `Year` | `Nonperiodical` |
| `checkUnique` | `false` | `true` |
| `posting` | `Deny` | `Allow` |
| `realTimePosting` | `Deny` | `Allow` |
| `registerRecordsDeletion` | `AutoDelete` | `AutoDeleteOnUnpost` |
| `actionsWritingOnPost` | `WriteModified` | `WriteSelected` |
| `privilegedPostingMode` | `false` | `true` |
| `privilegedUnpostingMode` | `false` | `true` |

`inputByString` не меняется: в справочнике пустая коллекция задаётся через
`defaultValue: []` и `defaultValueXMLRaw: {}`, а у документа значение `Number`
не выражено существующим `implicitValueYAML` и остаётся явным в YAML.

## Проверка

Существующие параметризованные XML → YAML проверки защищают исключение
defaults из YAML:

- `minimal.xml` больше не выгружает девять свойств по умолчанию;
- `withNumerator.xml` также исключает их, сохраняя нумератор и остальные явные
  данные;
- `full.xml` исключает значения, совпавшие с новыми неявными значениями, и
  сохраняет остальные явные отличия.

Отдельная YAML → XML проверка без reference подтверждает восстановление девяти
скалярных значений пустого документа.

## Поиск других неверных defaults

Для каждого metadataItem нужно создать минимальную XML-фикстуру в той же версии
платформы и сравнить её значения с парой `defaultValueXML` / `implicitValueYAML`
соответствующих правил. После импорта минимальный YAML не должен содержать
свойства, которые Конфигуратор установил автоматически, а обратное
преобразование без reference должно восстановить те же XML-значения. Затем
`git blame` показывает происхождение ошибки, но не подтверждает корректность
значения.
