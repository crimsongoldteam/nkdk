# Асинхронный поиск файлов YAML-проекта

## Контекст

После перехода discovery на обход реальных файлов проекта шаг `Поиск файлов проекта` всё ещё занимает заметное время на больших проектах. В профиле `/Users/nikita/git/nkdk-yaml` основная часть времени приходится на `readdir` по большому числу директорий.

Эксперимент в отдельном worktree показал:

- sync `readdirSync`: около `2.17s` в validation-profile для шага `Поиск файлов проекта`;
- async `fs.promises.readdir` с лимитом `32`: около `1.35s` для того же шага;
- focused-тесты проекта на экспериментальном варианте прошли.

## Решение

Перевести поиск файлов проекта на асинхронный API.

`discoverMetadataProjectResources` становится асинхронной функцией:

```ts
function discoverMetadataProjectResources(
  projectDir: string,
  options?: MetadataProjectResourceDiscoveryOptions
): Promise<MetadataProjectResourceRef[]>
```

Синхронные точечные функции остаются синхронными:

- `classifyMetadataProjectPath`;
- `resolveMetadataProjectResource`;
- `assertMetadataProjectPathInside`.

Они не обходят проект и не требуют async API.

## Обход директорий

Внутри `discoverMetadataProjectResources` используется `fs.promises.readdir` с очередью директорий и фиксированным лимитом параллелизма `32`.

Лимит пока захардкожен. Настройка через env, конфиг или автонастройка не входят в эту задачу.

Поведение фильтра сохраняется:

- `include: "all"` возвращает YAML и прочие файлы проекта;
- `include: "yaml"` возвращает только YAML-файлы проекта.

Для `include: "yaml"` не-`.yaml` файлы отбрасываются до вызова `classifyMetadataProjectPath`.

## Затрагиваемые места

Нужно перевести на `await` все вызовы project discovery:

- `packages/core/metadata/project/preparedYamlProject.ts`;
- `packages/core/metadata/validation/projectFiles.ts`;
- `packages/core/metadata/validation/validateProject.ts`;
- `packages/core/metadata/operations/projectSnapshot.ts`;
- `packages/core/metadata/appliedObjects/configuration/syncToXML.ts`;
- тесты `resources.test.ts`, `projectFiles.test.ts` и зависящие тесты.

`discoverValidationProjectFiles` также становится async, потому что внутри использует project discovery.

## Ошибки

Ошибки чтения директорий не маскируются. Если `fs.promises.readdir` падает, ошибка пробрасывается наружу так же, как раньше падал sync-обход.

Неизвестные файлы по-прежнему не считаются ошибкой discovery и просто не попадают в результат.

## Проверка

После реализации нужно запустить:

```bash
pnpm --filter @nkdk/core build
node .agents/skills/validation-profile/validation-profile.mjs /Users/nikita/git/nkdk-yaml --runs 3 --timing
pnpm test
```

Ожидаемый эффект: строка `Поиск файлов проекта` в validation-profile должна быть заметно быстрее sync-варианта. Общий validation-time может колебаться из-за worker-этапов, поэтому для оценки discovery смотрим именно эту строку.

## Не входит в задачу

- Подбор лимита под конкретную машину.
- Настройка лимита через env или конфиг.
- Кеширование списка файлов проекта между операциями MCP.
- Кеширование `describeMetadataRuleProjectResources`.
- Изменение логики классификации путей.
