# Metadata Item Links Command YAML Design

## Context

`validation-profile` на `/Users/nikita/git/nkdk-yaml` показывает крупный блок ошибок вида:

- `Не найдена ссылка: DataProcessor.Command`;
- `Не найдена ссылка: Catalog.Command`;
- `Не найдена ссылка: Document.Command`;
- `Не найдена ссылка: InformationRegister.Command`.

Причина не в том, что YAML-импорт должен поддерживать такие имена. YAML проекта должен оставаться русским представлением. Модельные сегменты вроде `DataProcessor`, `Catalog`, `Document`, `InformationRegister`, `Command` не должны появляться в YAML после импорта из XML.

Проблема относится к XML -> модель -> YAML: значения `MetadataItemLinks`, импортированные из XML в каноническом модельном виде, при экспорте в YAML должны форматироваться через уже заданный `metadataTarget` правила.

## Goal

Исправить генерацию YAML для найденных `*.Command` ссылок:

```text
DataProcessor.Панель.Command.Открыть
Catalog.Товары.Command.Печать
Document.Заказ.Command.Создать
InformationRegister.Настройки.Command.Открыть
```

должны записываться как:

```text
Обработка.Панель.Команда.Открыть
Справочник.Товары.Команда.Печать
Документ.Заказ.Команда.Создать
РегистрСведений.Настройки.Команда.Открыть
```

При этом YAML-импорт остаётся строгим: если пользователь вручную написал `DataProcessor...Command...` в YAML, это ошибка формата, а не поддерживаемый синтаксис.

## Architecture

Существующая граница остаётся правильной:

- `rules.ts` конкретного объекта задаёт смысл поля через `metadataTarget`;
- `metadataTargets` содержит нейтральное знание о переводе канонических корней и сегментов в YAML;
- оркестратор `exportToYAML` передаёт экспортёру значение, правило и контекст владельца;
- `MetadataItemLink` и `MetadataItemLinks` остаются универсальными типами строк-ссылок и не знают предметные объекты конфигурации сами.

Исправление не должно добавлять в `MetadataItemLinks` частный список объектов или условий по `DataProcessor`, `Catalog`, `Document`, `InformationRegister`. Он должен только использовать уже переданный `rule.metadataTarget`.

## Proposed Approach

В экспортёре `MetadataItemLink(s)` изменить выбор форматирования:

1. Если `rule.metadataTarget` задан, форматировать каждое значение напрямую через `formatMetadataTargetToYAML({ canonical, constraint: rule.metadataTarget, owner })`.
2. Если `rule.metadataTarget` не задан, оставить существующий запасной путь через `exportMetadataObjectStringToYAML` для старых правил без явного контракта.
3. Ошибки `formatMetadataTargetToYAML` при наличии `metadataTarget` не подавлять: если правило говорит, что поле содержит member-ссылку, а значение не соответствует constraint, это должна быть явная ошибка.

Так `MetadataItemLinks` начинает уважать уже существующий `metadataTarget`, но не получает новых знаний о прикладных объектах.

## Data Flow

Для `ФункциональнаяОпция.СоставФункциональнойОпции` правило уже содержит:

```ts
metadataTarget: {
  kind: "member",
  owner: "explicit",
  allowedObjectPaths: contentObjectPaths,
  allowedMemberPaths: contentMemberPaths,
  nestedObjectRoots: ["Subsystem"],
}
```

После исправления поток должен быть таким:

```text
XML Content/xr:Object
  -> importFromXML
  -> "DataProcessor.Панель.Command.Открыть"
  -> export MetadataItemLinks to YAML using rule.metadataTarget
  -> "Обработка.Панель.Команда.Открыть"
```

## Tests

Нужны регрессионные тесты на уровне `metadataRef/toYAML` или ближайшего общего экспортёра:

- `MetadataItemLinks` с `metadataTarget.kind = "member"` форматирует `DataProcessor...Command...` как `Обработка...Команда...`;
- то же для `Catalog`, `Document`, `InformationRegister`;
- при наличии `metadataTarget` некорректное значение не проглатывается;
- существующие object-only сценарии без `metadataTarget` продолжают работать через запасной путь.

После реализации нужно прогнать:

```bash
pnpm --filter @nakidka/core exec vitest run metadata/commonObjects/metadataRef/toYAML.test.ts metadata/commonObjects/metadataTargets/parse.test.ts
pnpm --filter @nakidka/core build
node .agents/skills/validation-profile/validation-profile.mjs /Users/nikita/git/nkdk-yaml --runs 1 --timing
pnpm test
```

Успех для найденного блока: ошибки `Не найдена ссылка` по `DataProcessor.Command`, `Catalog.Command`, `Document.Command`, `InformationRegister.Command` должны уйти из профиля после свежей сборки.

## Out Of Scope

- Не добавлять поддержку модельных корней и сегментов в YAML-импорт.
- Не делать post-process по готовому YAML-тексту.
- Не добавлять в `MetadataItemLinks` частные знания о всех прикладных объектах.
- Не реализовывать developer skill диагностики английских имён в рамках этой задачи; это отдельная задача.
