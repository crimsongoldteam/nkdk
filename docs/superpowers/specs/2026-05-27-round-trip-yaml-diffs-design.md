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

Планируемое направление:

Проверить, должна ли эта экономия YAML применяться к признакам учета плана счетов. Если для `AccountingFlag` и `ExtDimensionAccountingFlag` нужно сохранять точный `Synonym`, переопределить поведение локально в `packages/core/metadata/commonObjects/accountingFlag/rules.ts`, не ломая остальные регистровые поля.

Проверка:

- точечный тест на XML/YAML round-trip для признаков учета;
- повторный `round-trip-yaml` triage для подтверждения, что diff `1` исчез или изменился ожидаемо.

Статус: ожидает реализации.

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

Планируемое направление:

Добавить корневой metadataItem для `CommonCommand`, переиспользовав безопасную часть `MetadataCommandRules`, но с корректными путями для корневого объекта:

- XML-каталог `CommonCommands`;
- YAML-каталог `ОбщаяКоманда`;
- контейнер XMLRoot `CommonCommand`;
- внешний модуль `Ext/CommandModule.bsl` и YAML-путь для модуля команды.

Проверка:

- точечные тесты import/export для корневой общей команды;
- проверка восстановления внешнего модуля;
- повторный `round-trip-yaml` triage для подтверждения, что diff'ы `2-5` исчезли или изменились ожидаемо.

Статус: ожидает реализации.

## Порядок работы

1. Исправить и проверить `AccountingFlag / ExtDimensionAccountingFlag`.
2. Обновить эту спеку результатом решения 1.
3. Исправить и проверить корневые `CommonCommand`.
4. Обновить эту спеку результатом решения 2.
5. Запустить достаточную проверку по точечным тестам и диагностическому `round-trip-yaml`.
6. Перед финальным закрытием запустить `pnpm test` из корня worktree.

## Принятые уточнения

- Поведение `Synonym` меняется только для `AccountingFlag` и `ExtDimensionAccountingFlag`, потому что первый diff относится именно к этим типам. Общие регистровые поля остаются без изменений, пока отдельный diff не покажет необходимость расширить правило.
- YAML-каталог корневой общей команды называется `ОбщаяКоманда`, потому что такое имя уже используется в ссылках `CommonCommand -> ОбщаяКоманда`.
