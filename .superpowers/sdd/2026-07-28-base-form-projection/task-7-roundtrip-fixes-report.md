# Task 7 — исправления точного round-trip BaseForm

Статус: **DONE**.

Рабочий каталог: `/Users/nikita/git/nkdk/.worktrees/extension-architecture-spec`.

## Результат

- Исходное состояние: 60 отличающихся `BaseForm/Form.xml`.
- Итог свежего полного цикла `cf/all` → `cfe/Расширение_All`: 0 смысловых XML-расхождений.
- Отдельно отсутствует только ожидаемый платформенный `ConfigDumpInfo.xml`; NKDK его не создаёт.
- Проверенный результат: `/private/tmp/nkdk-cfe-wave-zero2`.

## Подтверждённые причины и исправления

- Проекция использовала только пересечение `present`, хотя свежий импорт cfe хранит часть канонических свойств формы в `order`. Доступность свойства теперь учитывает `order ∪ present`, а признак XML-присутствия задаётся нейтральным договором правила.
- Порядок свойств формы восстанавливался не из совмещённых ограничений базовой конфигурации и расширения. Добавлено общее слияние частичных порядков с детерминированной обработкой циклов.
- Для вложенных узлов дерева не сохранялись общие состояния, канонические имена singleton-элементов и свойства, не посещённые выбранным cfe-вариантом. Индекс и проекция теперь разделяют cf/cfe-состояние и используют пересечение доступных правил узла без условий по конкретным формам или полям.
- Явное значение по умолчанию, восстановленное из неявного значения YAML, терялось при обратном преобразовании. В общий вызов атомарного `toXML` передан нейтральный признак сохранения индексированного неявного значения.
- Пустые вложенные проекции не создаются, если XML-правило не задаёт `defaultValueXMLEmpty`; псевдонимы берутся из существующего YAML-дерева.

## Исправление по итоговой рецензии

- `selectedPropertyKeys` для элементов формы вычислялся по сырому tree-YAML. У кнопок структурный `Вид` ошибочно считался значением XML-свойства `type`, хотя обычный toXML получает его из `ТипКнопки` после `normalizeItemYAML`.
- Добавлен RED-тест: в `cf` у кнопки задан `ТипКнопки`, в `cfe` он отсутствует, поэтому `BaseForm` не должен содержать `<Type>`. До исправления создавался `Type: UsualButton`.
- Перед вычислением выбранных свойств теперь применяется зарегистрированный договор `yamlToXMLNestedRule.normalizeItemYAML`. Исправление не содержит списка типов элементов или имён свойств и использует ту же нормализацию, что обычный toXML.

## Итоговая fix-wave

- RED зафиксировал два дефекта: массив `CommandInterface` целиком переносил из `cf` ссылку `Form.Command.Базовая` при пустом пересечении команд, а колонка явно заимствованного табличного реквизита без `xmlId` в снимке `cf` не завершала построение ошибкой.
- Общий проектор получил рекурсивный договор объектов, массивов и ссылок. Конкретная структура `CommandInterface` зарегистрирована рядом с property-type: недоступная обязательная команда удаляет только содержащий её item, недоступный `DataPath` удаляет поле, неизвестный ссылочный тип завершает проекцию ошибкой.
- `CommandName` различает локальные `Form.Command.*` и внешние metadata-пути. Локальная ссылка проверяется по явно заимствованным командам, внешняя сохраняется.
- Обязательность идентификатора теперь объявляется в `yamlToXMLNestedRule`. Общий YAML → XML обход проверяет identity в вычисленном item-контексте только при включённом нейтральном режиме существующих идентификаторов; построитель `BaseForm` включает этот режим.
- Из `baseFormIndex.ts` удалены списки сегментов logical address. `FormAttribute`, `FormAttributeColumn`, `FormCommand`, прямые элементы формы и singleton-элементы объявляют обязательный `xmlId` при своей регистрации.
- Коммит исправления: `a57b7c847` (`fix: :bug: завершить проекцию структуры BaseForm`).

## Проверки

| Команда | Результат |
| --- | --- |
| `pnpm exec vitest run metadata/orchestration/property/fromYAMLToXML.test.ts metadata/forms/clientApplicationForm/baseFormIndex.test.ts metadata/forms/clientApplicationForm/baseFormProjection.test.ts metadata/forms/clientApplicationForm/baseForm.test.ts --no-isolate` из `packages/core` | 4 файла, 72 теста пройдено |
| `pnpm --filter @nkdk/core exec vitest run metadata/forms/clientApplicationForm/baseFormProjectionRegistry.test.ts metadata/forms/clientApplicationForm/baseFormProjection.test.ts metadata/forms/clientApplicationForm/baseFormIndex.test.ts metadata/forms/clientApplicationForm/baseForm.test.ts metadata/orchestration/property/fromYAMLToXML.test.ts metadata/orchestration/metadataCollection/fromYAMLToXML.test.ts metadata/forms/commonObjects/commandInterface metadata/forms/commonObjects/formAttribute metadata/forms/commonObjects/formCommand metadata/forms/elements/orchestration --no-isolate` | 16 файлов, 158 тестов пройдено |
| `pnpm type-check` из корня | пройдено |
| `git diff --check` | пройдено |
| Сравнение `/Users/nikita/git/round-trip/cfe/all-extension` и `/private/tmp/nkdk-cfe-wave-zero2/cfe-output` без `ConfigDumpInfo.xml` | 0 файлов, 0 строк |

Полный `pnpm test` в этой дополнительной задаче не запускался по указанию контроллера; его выполняет контроллер.

XML-фикстуры и пользовательский `packages/mcp/README.md` не изменялись.
