# Разбор round-trip-yaml diff'ов

Дата: 2026-05-27

## Цель

Разобрать первые пять расхождений полного metadata round-trip `XML -> модель -> YAML -> модель -> XML` для конфигурации `acc` и исправлять их по группам причин.

Исходная диагностика:

- XML-каталог: `/Users/nikita/git/round-trip-source/acc`
- YAML-каталог: `/var/folders/6c/ygl5zz5d7yv2wxd7v36_dh1r0000gn/T//round-trip-yaml/acc`
- Всего diff'ов: `1173`
- Рассматриваемый диапазон: `1-5`

## Границы

Работа ведется в отдельном worktree:

- путь: `/Users/nikita/git/nakidka-core/.worktrees/round-trip-yaml-diffs`
- ветка: `codex/round-trip-yaml-diffs`

Разбор идет по группам причин, а не строго по отдельным файлам, потому что пункты `2-5` относятся к одной потере корневых `CommonCommand` и их внешних модулей.

После каждого принятого решения эта спека обновляется: фиксируются исходный diff, причина, выбранное изменение, проверка и результат.

## Решение 1: AccountingFlag / ExtDimensionAccountingFlag

Связанные diff'ы:

- `1`: `ChartsOfAccounts/Хозрасчетный.xml`

Наблюдение:

В XML у части `AccountingFlag` и `ExtDimensionAccountingFlag` есть непустой `Synonym`, но после YAML round-trip он превращается в `<Synonym/>`.

Пример:

```diff
- <Synonym>
-   <v8:item>
-     <v8:lang>ru</v8:lang>
-     <v8:content>Учет по подразделениям</v8:content>
-   </v8:item>
- </Synonym>
+ <Synonym/>
```

Текущая гипотеза:

`AccountingFlagRules` и `ExtDimensionAccountingFlagRules` наследуют `synonym` из `commonRegisterFieldProperties`. Там включено `excludeIfEqualNameYAML: true`, поэтому YAML может не сохранять синоним, совпадающий с именем, а обратный экспорт не всегда восстанавливает исходный текст.

Разбор:

Сам механизм `excludeIfEqualNameYAML` уже используется в других объектах. Для `metadataAttribute` и `metadataTabularSection` рядом с ним есть `defaultValue` на `importFromYAML`, который восстанавливает синоним из имени через `addDefaultLanguageNameToSynonym(context, undefined, name)`.

В `commonRegisterFieldProperties.synonym` такой связки нет: правило умеет исключить равный имени синоним из YAML, но при YAML -> модель получает пустой `emptySynonym`, а не восстановленный синоним.

Рассмотренные варианты:

- (А) повторить существующий паттерн восстановления в `commonRegisterFieldProperties.synonym`;
- (Б) сделать такое восстановление только в `AccountingFlagRules`;
- (В) отключить `excludeIfEqualNameYAML`.

Выбранное решение:

(А) Повторить существующий паттерн в общем правиле регистровых полей. Это сохраняет компактный YAML и чинит именно нарушенную пару операций: если YAML-экспорт исключил синоним как равный имени, YAML-импорт должен восстановить его из `name`.

Решение должно затронуть `packages/core/metadata/commonObjects/metadataRegisterField/rules.ts`, а не локально `accountingFlag/rules.ts`, потому что проблема находится в общем правиле, унаследованном `AccountingFlag` / `ExtDimensionAccountingFlag`.

Проверка:

- точечный тест на XML/YAML round-trip для признаков учета;
- повторный `round-trip-yaml` triage для подтверждения, что diff `1` исчез или изменился ожидаемо.

Статус: решение согласовано, реализация не начата.

## Решение 2: CommonCommand

Связанные diff'ы:

- `2`: `CommonCommands/АвизоПоОСВходящее.xml`
- `3`: `CommonCommands/АвизоПоОСВходящее/Ext/CommandModule.bsl`
- `4`: `CommonCommands/АвизоПоОСИсходящее.xml`
- `5`: `CommonCommands/АвизоПоОСИсходящее/Ext/CommandModule.bsl`

Наблюдение:

Корневые общие команды из `CommonCommands/*.xml` полностью удаляются после YAML round-trip. Их внешние модули из `CommonCommands/<Имя>/Ext/CommandModule.bsl` удаляются как следствие удаления владельца.

Пример:

```diff
- <CommonCommand uuid="87459c55-b97a-4dee-8b24-191dde633910">
-   <Properties>
-     <Name>АвизоПоОСВходящее</Name>
-   </Properties>
- </CommonCommand>
```

Текущая гипотеза:

В проекте есть `MetadataCommandRules`, но они описывают команды как дочерние объекты внутри других metadataItem. Корневого правила для `CommonCommand` с `xmlDir: "CommonCommands"`, `itemTypePrefix: "ОбщаяКоманда"` и `XMLRoot` сейчас нет в `TopLevelMetadataItemRules`.

Разбор:

`CommonCommand` в XML-конфигурации лежит как самостоятельный корневой объект в каталоге `CommonCommands`. При этом существующий `MetadataCommandRules` используется как правило дочерних команд внутри других metadataItem через `childCollections`.

Рассмотренные варианты:

- (А) добавить отдельный корневой metadataItem для `CommonCommand`;
- (Б) расширить существующий `MetadataCommandRules`, чтобы он был одновременно дочерним и корневым;
- (В) считать `CommonCommands` непрозрачными внешними файлами и копировать их без YAML-модели.

Выбранное решение:

(А) Добавить отдельный корневой metadataItem для `CommonCommand`, переиспользовав безопасную часть `MetadataCommandRules`, но с корректными корневыми настройками:

- XML-каталог `CommonCommands`;
- YAML-каталог `ОбщаяКоманда`;
- контейнер XMLRoot `CommonCommand`;
- внешний модуль `Ext/CommandModule.bsl` и YAML-путь для модуля команды.

Причины:

- это соответствует физической структуре XML-конфигурации;
- не смешивает корневые свойства `xmlRoot`, `xmlDir`, `itemTypePrefix` с дочерними командами внутри объектов;
- дает нормальную YAML-модель для общих команд, а не временное копирование файлов.

Проверка:

- точечные тесты import/export для корневой общей команды;
- проверка восстановления внешнего модуля;
- повторный `round-trip-yaml` triage для подтверждения, что diff'ы `2-5` исчезли или изменились ожидаемо.

Статус: решение согласовано, реализация не начата.

## Порядок работы

1. Исправить и проверить `AccountingFlag / ExtDimensionAccountingFlag`.
2. Обновить эту спеку результатом решения 1.
3. Исправить и проверить корневые `CommonCommand`.
4. Обновить эту спеку результатом решения 2.
5. Запустить достаточную проверку по точечным тестам и диагностическому `round-trip-yaml`.
6. Перед финальным закрытием запустить `pnpm test` из корня worktree.

## Принятые уточнения

- Для diff `1` выбран общий паттерн восстановления `Synonym` в `commonRegisterFieldProperties`, по аналогии с `metadataAttribute` и `metadataTabularSection`. Локальное отключение `excludeIfEqualNameYAML` для `AccountingFlag` отклонено как менее точное.
- YAML-каталог корневой общей команды называется `ОбщаяКоманда`, потому что такое имя уже используется в ссылках `CommonCommand -> ОбщаяКоманда`.
