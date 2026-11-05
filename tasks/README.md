# Tasks — ponteiro deste repo

| Campo | Valor |
|---|---|
| API | https://tasks.daempresa.com.br |
| UI | https://tasks.daempresa.com.br/ |
| Discovery | `GET /api/welcome` |
| Contract | `GET /api/welcome/contract` |
| Install | `GET /api/welcome/install?project_db_id=chineseLearning` |
| Manifest `projectDbId` | `chineseLearning` (`itcsManifest.yaml`) |

Token: `local/credentials/tasks.env` → `TASKS_API_TOKEN` (gitignored; ver
`tasks.env.example`). Nunca neste ficheiro. Só Bearer no servidor / agente —
não no browser do aluno.

Pack humano no host: `/welcome` · `welcome/CONTRACT.md` · `welcome/INSTALL.md`.
Skill Cursor: `/tasks`.

Colunas abertas para caça de trabalho: `novas`, `sugestoes`, `em_analise`,
`em_desenvolvimento`, `em_testes` (ignorar `entregue` salvo pedido).
