# Результат оптимизации длительности тестов core

## Причина

Проект `core-metadata` загружал полную композицию метаданных через `setupFiles` для всех своих тестов. Фактически она требовалась только семи сквозным тестовым файлам. Полная регистрация стала их явной зависимостью, а общий setup сохранил только запрет настоящего `Piscina` и сброс тестового контекста.

Лимиты не изменены: setup пакета — 3 000 мс, test file — 1 000 мс. Коэффициент macOS не добавлялся.

## До изменения

- core: 42,92–49,22 с;
- setup: 6,46–8,97 с;
- все 6174 функциональные проверки проходили, но duration checker возвращал код 1;
- обычный `pnpm test` останавливался на `@nkdk/core`.

Стабильно превышали 1 000 мс:

| Test file | Время до |
| --- | ---: |
| `forms/commonObjects/dynamicList/fromXMLToYAML.test.ts` | 1,80–2,22 с |
| `importFromXml/importConfigurationExtension.test.ts` | 1,69–1,82 с |
| `validation/schemaRegistry.test.ts` | 1,39–1,61 с |
| `importFromXml/worker.test.ts` | 1,32–1,40 с |
| `validation/projectFileSchema.test.ts` | 1,27–1,38 с |

## После изменения

Три обязательных core-прогона:

| Seed | Core | Setup | Результат |
| --- | ---: | ---: | --- |
| `20260730` | 17,40 с | 286 мс | 712 файлов, 6175 проверок, PASS |
| `20260731` | 17,55 с | 301 мс | 712 файлов, 6175 проверок, PASS |
| `20260730` повторно | 18,62 с | 345 мс | 712 файлов, 6175 проверок, PASS |

Подробный контрольный срез занял 17,30 с при setup 301 мс:

| Test file | Время после |
| --- | ---: |
| `forms/commonObjects/dynamicList/fromXMLToYAML.test.ts` | 843 мс |
| `importFromXml/importConfigurationExtension.test.ts` | 781 мс |
| `validation/schemaRegistry.test.ts` | 607 мс |
| `importFromXml/worker.test.ts` | 620 мс |
| `validation/projectFileSchema.test.ts` | 638 мс |

## Полная проверка

Обычный `pnpm test` без `CI=true` завершился за 25,37 с:

- core: 712 файлов, 6175 проверок, PASS;
- platform: 20 файлов, 186 проверок, PASS;
- MCP: 30 файлов и 154 проверки PASS, 1 файл и 2 интеграционные проверки штатно пропущены;
- превышений setup или test file нет.

Также прошли:

- `pnpm test:architecture:rules` — 64 проверки;
- `pnpm test:architecture` — новых нарушений и циклов нет;
- `pnpm duplicates -- --base 0d550245a` — новых дублей нет.

Запланированные дополнительные разделения DynamicList, validation schema и import worker не выполнялись: после устранения общей причины их duration RED больше не воспроизводится.
