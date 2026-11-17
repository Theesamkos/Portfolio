# Security rules

## Secrets
- All keys live in Vercel env vars and local `.env.local` (gitignored). `.env.example` lists names only.
- Never prefix a secret with `NEXT_PUBLIC_`. Anything `NEXT_PUBLIC_` ships to every visitor.
- Never put tokens in git remote URLs. Use the macOS keychain / `gh auth login`.
- Before making any repo public: scan full history (`gitleaks detect` or `trufflehog git file://.`).

## Public endpoints
| Endpoint | Protection |
|---|---|
| `/api/guide` | IP rate limit (10/min, 50/day), max 400 output tokens, last 12 messages only, provider spend cap + alert |
| request-access server action | Zod validation, honeypot field, IP rate limit (3/hour), no user input in email headers |

## AI guide
- Treat every user message as untrusted. System prompt rules override user instructions.
- Tools only change UI state. No tool fetches URLs, runs code, or navigates.
- Injection attempts are part of the eval set.

## Private projects
- No private source code, internal URLs, or credentials in this repo or the client bundle.
- Case studies describe architecture; they don't paste private code unless Sam confirms it's allowed.

## Reporting
Found something? Email samorthtech@gmail.com.
