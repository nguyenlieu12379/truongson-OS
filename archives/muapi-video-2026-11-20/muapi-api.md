# Muapi API (video generation)

Tool for: AI video generation (text-to-video, image-to-video, video effects, lip sync) plus image and audio.
Skill: `.claude/skills/muapi-video/` (vendored from SamurAIGPT/muapi-skills). Recipes and scripts live there.
Frontend reference: github.com/anil-matcha/open-generative-ai, a browser studio on the same API. Not used by the AIOS directly.

## Auth
- Base URL: `https://api.muapi.ai`
- Header: `x-api-key: $MUAPI_API_KEY`
- Key from https://muapi.ai/dashboard (or a sandbox key, see below). Store it in the environment only, never in files or chat.

## Endpoints used
| Purpose | Call |
|---|---|
| List models | `GET /api/v1/models` |
| Model schema | `GET /api/v1/models/{name}` |
| Cost estimate | `POST /api/v1/models/{name}/estimate-cost` |
| Upload a local file | `POST /api/v1/upload_file` (multipart), returns a hosted URL for image or video inputs |
| Submit a job | `POST /api/v1/{model-endpoint}` with JSON prompt and parameters, returns `request_id` |
| Poll a job | `GET /api/v1/predictions/{request_id}/result` until status is `completed` or `failed` |
| Balance | `GET /api/v1/account/balance` |
| Sandbox key (mock, free) | `POST /api/v1/keys` with `{"is_test": true}` |

Pattern: submit, then poll every 3 to 10 seconds. On `failed`, show the `error` field as is.

## Helper scripts (in the pack)
- `skills/core/media/generate-video.sh --prompt "..." --model MODEL --aspect-ratio 9:16 --duration 5 [--async] [--json]`
- `skills/core/media/image-to-video.sh`, `upload.sh`
- `skills/core/platform/check-result.sh --id REQUEST_ID [--once] [--json]`
- `skills/core/platform/setup.sh --test` checks the key.
- Optional CLI: `npm i -g muapi-cli` (not vendored). Prefer it when installed.

## Open items
- Key status: not yet set. Add `MUAPI_API_KEY` before the first paid run. Log the choice of default models in `decisions/log.md`.
