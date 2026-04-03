# Скрипты для шага 8 (`__fixtures__/data.ts`)

Раннеры живут в репозитории: [`packages/core/scripts/new-metadata-item/`](../../../../packages/core/scripts/new-metadata-item) — там доступны алиас `~/` и `setupTests` (регистрация типов метаданных).

Без переменных окружения соответствующие `it` в этих файлах **пропускаются** (`it.skipIf`), чтобы общий `pnpm test` в `packages/core` не падал.

Здесь — **как запускать** и **шаблоны** для копирования в каталог объекта (способ B), если не хочется задавать env.

## Предусловия

Из корня репозитория: `pnpm install`. Команды ниже — из каталога `packages/core`.

## Способ A: печать YAML из внутреннего экспорта (`data.ts`)

После того как в `__fixtures__/data.ts` заданы внутренние константы (например `fullMyObject`), можно получить фактический YAML для полей `*YAML`:

```bash
cd packages/core && \
NKDK_METADATA_PRINT_MODULE=metadata/<путь>/__fixtures__/data.ts \
NKDK_METADATA_PRINT_EXPORT=<имяЭкспорта> \
NKDK_METADATA_PRINT_RULE='{"type":"<PropertyRuleType>","yaml":"<КлючВYAML>"}' \
pnpm vitest run scripts/new-metadata-item/print-export-yaml.test.ts --run
```

Пример для `DCSParameter`:

```bash
NKDK_METADATA_PRINT_MODULE=metadata/commonObjects/dataCompositionSystem/dcsParameter/__fixtures__/data.ts \
NKDK_METADATA_PRINT_EXPORT=fullDCSParameters \
NKDK_METADATA_PRINT_RULE='{"type":"DCSParameter","yaml":"Параметры"}' \
pnpm vitest run scripts/new-metadata-item/print-export-yaml.test.ts --run
```

В stdout будет JSON — его можно вставить в `data.ts` (внешний ключ уже соответствует `rule.yaml`).

Переменные:

| Переменная | Смысл |
|------------|--------|
| `NKDK_METADATA_PRINT_MODULE` | Путь к `.ts` от **корня `packages/core`** |
| `NKDK_METADATA_PRINT_EXPORT` | Имя экспортируемой константы с внутренним значением |
| `NKDK_METADATA_PRINT_RULE` | JSON объекта `PropertyRule` (как в тестах: `type`, при необходимости `yaml`) |

## Способ A: печать результата импорта XML

Для коллекций удобно обернуть несколько корневых элементов в один тег (см. тесты `dcsParameter`).

```bash
cd packages/core && \
NKDK_METADATA_PRINT_XML_PATH=metadata/<путь>/__fixtures__/full.xml \
NKDK_METADATA_PRINT_XML_WRAPPER=<ИмяОбёртки> \
NKDK_METADATA_PRINT_XML_ROOT_TAG=<ИмяОбёртки> \
NKDK_METADATA_PRINT_RULE='{"type":"<PropertyRuleType>"}' \
pnpm vitest run scripts/new-metadata-item/print-import-xml.test.ts --run
```

Опционально: `NKDK_METADATA_PRINT_FOR_REFERENCE=true` — контекст `forReference: true` при импорте.

**Ограничение:** если импорт падает на опциональных свойствах (например `SettingsParameterValue` с `value === undefined`), вывод не появится — нужны правки оркестрации; это ожидаемо.

## Способ B: шаблоны в `templates/`

1. Скопируйте нужный `.template` в `__fixtures__/` или рядом с тестами объекта, уберите суффикс `.template`.
2. Замените плейсхолдеры `__...__`.
3. `cd packages/core && pnpm vitest run <путь/к/временному.test.ts> --run`
4. Скопируйте вывод в `data.ts`, временный файл удалите.

## Прочее

- Раннеры **не заменяют** ручную проверку `satisfies` и согласование с XML-фикстурами: они только печатают фактический результат движка.
- Имена фикстур и структура `data.ts` — по [fixtures-data](../references/fixtures-data.md).
