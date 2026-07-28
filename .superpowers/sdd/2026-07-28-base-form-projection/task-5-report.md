# Task 5 report

## Статус

Выполнено. `BaseForm` строится обычным YAML → XML обработчиком из
`projectClientApplicationBaseForm`, использует составной reader cf+cfe и
отбрасывает записи в снимок расширения.

`DataPath` вычисляется по той же проекции, корневые namespace удаляются без
изменения `_version`; обход готового XML не добавлялся.

## TDD

- RED проекции: `baseForm.test.ts` сохранял `Height=40`, события и скрытый
  реквизит из полной `baseYaml`.
- RED индексов: BaseForm не получал базовые `xmlId`; worker создавал новый
  `id=1` вместо `id=10` из cf.
- RED проводки: `baseConfigurationIndex` не доходил до зарегистрированной
  возможности подготовки XML.
- Дополнительный RED выявил, что строгий reader считал presence-check обычного
  вложенного свойства обязательным `xmlId`. Проверка сужена до прямых
  компонентов формы и канонических singleton-элементов.

## Проверки

- `pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/baseForm.test.ts metadata/forms/clientApplicationForm/baseFormIndex.test.ts metadata/forms/clientApplicationForm/fromYAMLToXML.test.ts metadata/forms/clientApplicationForm/syncToXML.test.ts metadata/fullSyncToXml/prepareAssignment.test.ts metadata/fullSyncToXml/worker.test.ts`
  — 6 файлов, 43 теста.
- `pnpm --filter @nkdk/core type-check` — успешно.
- `git diff --check` — успешно.

Полный `pnpm test` не запускался по прямому указанию координатора задачи.

## Отклонение от file map

Для передачи готового reader без hidden global и повторного чтения snapshot
потребовались минимальные изменения проводящих файлов вне исходного списка:
worker, нейтральный capability, общий обработчик external-file property и его
тип. Общие слои только переносят opaque `baseConfigurationIndex` и не знают о
BaseForm, DataPath, формах или конкретных item types.

## Сомнения

Нет. Существующее пользовательское изменение `packages/mcp/README.md` не
затронуто и не войдёт в коммит.
