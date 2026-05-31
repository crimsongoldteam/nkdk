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

Для всех остальных свойств из чистого XML задаются XML-defaults по эталонному `Configuration.xml`: `defaultValueXML` для явных значений, raw/empty default для пустых тегов согласно текущему API правил. Это нужно, чтобы XML-import убирал default-значения из модели, а YAML-export не писал их. Для примитивов и системных перечислений, которые участвуют в YAML-цикле, добавляется соответствующий `defaultValueYAML`, чтобы YAML -> XML восстанавливал модельное значение без ручных преобразователей.

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
