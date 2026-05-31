# Configuration Clean Defaults

## Цель

При импорте чистой конфигурации из XML в YAML корневой `Конфигурация.yaml` должен содержать только четыре обязательных поля:

```yaml
Имя: Конфигурация
РежимСовместимостиРасширенияКонфигурации: Версия8_3_27
ОсновнойЯзык: Language.Русский
РежимСовместимости: Версия8_3_27
```

Остальные свойства чистого `Configuration.xml` должны считаться XML-defaults и не попадать в YAML, если их значения равны эталону.

## Источники

- `/home/nikita/git/round-trip/clean/Configuration.xml` - источник истины для чистой конфигурации.
- `/home/nikita/git/new-test-yaml/Конфигурация.yaml` - текущее неверное YAML-представление.
- `/home/nikita/git/new-test-yaml/КонфигурацияЦель.yaml` - ожидаемое YAML-представление.
- `packages/core/metadata/appliedObjects/configuration/rules.ts` - правила корневого объекта конфигурации.
- `packages/core/metadata/systemEnumerations/types.ts` - существующее системное перечисление `CompatibilityMode`.

## Решение

В `MetadataConfigurationRules` четыре поля становятся обязательными в модели:

- `name`;
- `configurationExtensionCompatibilityMode`;
- `defaultLanguage`;
- `compatibilityMode`.

Поля `configurationExtensionCompatibilityMode` и `compatibilityMode` переводятся с `string` на `SystemEnumeration` с `typeSE: "CompatibilityMode"`. YAML должен использовать русские значения перечисления, например `Версия8_3_27`, а XML должен продолжать хранить платформенное значение `Version8_3_27`.

В `CompatibilityMode` добавляется отсутствующее значение `Version8_3_27 <-> Версия8_3_27`.

Для всех остальных свойств из чистого XML задаются XML-defaults по эталонному `Configuration.xml`: `defaultValueXML` для явных значений и `defaultValueXMLRaw` для пустых тегов. Это нужно, чтобы XML-import убирал default-значения из модели, а YAML-export не писал их.

Для clean-defaults не нужно подставлять пустые строки в модель. Пустой XML-тег вроде `<DefaultConstantsForm/>` должен импортироваться как `undefined`, отсутствовать в YAML и восстанавливаться при XML-export через `defaultValueXMLRaw: ""`. Поэтому для таких полей не используем связку `defaultValueXMLEmpty: ""` + `defaultValue: ""` + `defaultValueYAML: ""`: она делает пустую строку частью модели, что здесь неверно.

## Решение по полям

| XML/YAML | Default в clean XML | Модель после XML-import | YAML | Правило |
| --- | --- | --- | --- | --- |
| `Name` / `Имя` | `Конфигурация` | строка | писать всегда | `required`, без default |
| `ConfigurationExtensionCompatibilityMode` / `РежимСовместимостиРасширенияКонфигурации` | `Version8_3_27` | `Version8_3_27` | `Версия8_3_27` | `required`, `SystemEnumeration`, `typeSE: "CompatibilityMode"`, `preserveExplicitDefaultXML` |
| `DefaultLanguage` / `ОсновнойЯзык` | `Language.Русский` | `Language.Русский` | писать всегда | `required`, `MetadataItemLink`, `preserveExplicitDefaultXML` |
| `CompatibilityMode` / `РежимСовместимости` | `Version8_3_27` | `Version8_3_27` | `Версия8_3_27` | `required`, `SystemEnumeration`, `typeSE: "CompatibilityMode"`, `preserveExplicitDefaultXML` |
| пустые строковые теги: `NamePrefix`, `Comment`, `Vendor`, `Version`, `UpdateCatalogAddress`, `DefaultReportAppearanceTemplate`, `DefaultSearchForm`, `DefaultInterface`, `DefaultConstantsForm` | пустой тег | `undefined` | не писать | `defaultValueXMLRaw: ""`, без `defaultValueXMLEmpty: ""` |
| пустые текстовые представления `I8nText`: `Synonym`, `BriefInformation`, `DetailedInformation`, `Copyright`, `VendorInformationAddress`, `ConfigurationInformationAddress` | пустой тег | `undefined` | не писать | `defaultValueXMLRaw: ""`, без модельного default |
| пустые ссылки и списки ссылок: роли, хранилища, основные формы, стиль | пустой тег | `undefined` | не писать | `defaultValueXMLRaw: ""`, если нужно восстанавливать чистый XML без reference |
| `DefaultRunMode` / `ОсновнойРежимЗапуска` | `ManagedApplication` | `undefined` | не писать | `defaultValueXML: "ManagedApplication"` |
| `UsePurposes` / `НазначенияИспользования` | `PlatformApplication` | `undefined` | не писать | оставить текущую спец-логику `UsePurposes` |
| `ScriptVariant` / `ВариантВстроенногоЯзыка` | `Russian` | `undefined` | не писать | `defaultValueXML: "Russian"` |
| boolean-флаги `IncludeHelpInContents`, `UseManagedFormInOrdinaryApplication`, `UseOrdinaryFormInManagedApplication` | `false` | `undefined` | не писать | `defaultValueXML: false` |
| `UsedMobileApplicationFunctionalities` / `ИспользуемаяФункциональностьМобильногоПриложения` | канонический список clean XML | `undefined`, если список равен default | писать только отличия | локальный обработчик типа по аналогии со стандартными реквизитами |
| `MainClientApplicationWindowMode` / `РежимОсновногоОкнаКлиентскогоПриложения` | `Normal` | `undefined` | не писать | `defaultValueXML: "Normal"` |
| `DataLockControlMode` / `РежимУправленияБлокировкойДанных` | `Managed` | `undefined` | не писать | `defaultValueXML: "Managed"` |
| `ObjectAutonumerationMode` / `РежимАвтонумерацииОбъектов` | `NotAutoFree` | `undefined` | не писать | `defaultValueXML: "NotAutoFree"` |
| `ModalityUseMode` / `РежимИспользованияМодальности` | `DontUse` | `undefined` | не писать | `defaultValueXML: "DontUse"` |
| `SynchronousPlatformExtensionAndAddInCallUseMode` / `РежимИспользованияСинхронныхВызововРасширенийПлатформыИВнешнихКомпонент` | `DontUse` | `undefined` | не писать | `defaultValueXML: "DontUse"` |
| `InterfaceCompatibilityMode` / `РежимСовместимостиИнтерфейса` | `Taxi` | `undefined` | не писать | `defaultValueXML: "Taxi"` |
| `DatabaseTablespacesUseMode` / `РежимИспользованияТабличныхПространствБазыДанных` | `DontUse` | `undefined` | не писать | `defaultValueXML: "DontUse"` |

Default-поля выше не должны использовать `defaultValueYAML` для подстановки значения в модель при YAML-import. Если ключа нет в YAML, модель остается компактной; XML-default восстанавливается на этапе XML-export правилом `defaultValueXML` или `defaultValueXMLRaw`.

## Мобильная функциональность

Для `UsedMobileApplicationFunctionalities` вводится канонический список из clean XML в порядке XML. Default-значения:

- `Biometrics`: `true`;
- `OSBackup`: `true`;
- все остальные функциональности из clean XML: `false`.

YAML-формат хранит только отличия от канонического списка. Если отличий нет, поле `ИспользуемаяФункциональностьМобильногоПриложения` не пишется. При YAML-import отличия накладываются на канонический список, чтобы XML-export мог восстановить полный набор `app:functionality`.

Поле `Использовать` в YAML должно использовать общий формат boolean проекта: `Истина` / `Ложь`, а не нативные YAML `true` / `false`. Текущее поведение с `true` / `false` возникает из-за локального обработчика `UsedMobileApplicationFunctionalities`, который возвращает обычный `boolean` и обходит общий тип `boolean`. В реализации этот обработчик должен использовать тот же контракт, что и остальные boolean-поля.

## Границы

Не меняем существующие XML-фикстуры как источник истины без отдельного явного решения. Тест чистой конфигурации должен опираться на `/home/nikita/git/round-trip/clean/Configuration.xml`: через отдельную тестовую копию, временный каталог теста или иной недеструктивный способ.

Не добавляем ручные `fromXML/toXML/fromYAML/toYAML` правила для конфигурации: поведение должно остаться rule-driven через `rules.ts` и существующие обработчики свойств.

Не меняем имя файла `Конфигурация.yaml` и не переносим корневую конфигурацию в отдельную директорию.

## Проверка

Точечные проверки:

- импорт чистого `Configuration.xml` пишет ровно четыре YAML-ключа;
- оба режима совместимости в YAML пишутся как `Версия8_3_27`;
- YAML с четырьмя ключами восстанавливает `Configuration.xml` с default-полями через reference;
- существующий full-round-trip конфигурации не теряет нестандартные значения;
- типы конфигурации учитывают новые `required` поля.

Перед закрытием задачи нужно выполнить `pnpm test` из корня проекта.
