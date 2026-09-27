# CHECKPOINTS — durable Human Gate interrupts

Format: `INTERRUPT-ID | cycle | gate | status | opened_at | resume_token | scope_ref`

INT-0001 | C1/C2 | Human Gate 2 (release) | PENDING | 2026-08-01T15:50:45+02:00 | gate2-sentry-24h | REQ-0009; EVAL_RESULTS.md; deploy application tip df4e189+ and complete 24h Sentry watch
INT-0002 | C2 | Human Gate 1 (blueprint) | RESOLVED | 2026-09-09T14:18:00+02:00 | gate1-node24-deps-20260909 | REQ-0228/0229/0230 approved GATE-0003; synthesis in progress
INT-0003 | C2 | Human Gate 1 (blueprint) | RESOLVED | 2026-09-09T15:10:00+02:00 | gate1-sentry-triage-20260909 | REQ-0232..0235 approved GATE-0004; synthesis in progress
INT-0004 | C2 | Human Gate 1 (blueprint) | RESOLVED | 2026-09-09T15:31:00+02:00 | gate1-order-fees-20260909 | REQ-0236 approved GATE-0005; synthesis in progress
INT-0005 | C2 | Human Gate 1 (blueprint) | RESOLVED | 2026-09-09T15:47:00+02:00 | gate1-hydration-currency-20260909 | REQ-0237 approved GATE-0006; synthesis in progress
INT-0006 | C2 | Human Gate 1 (blueprint) | RESOLVED | 2026-09-09T16:05:00+02:00 | gate1-admin-bi-currency-20260909 | REQ-0238 approved GATE-0007; synthesis in progress
INT-0007 | C2 | Human Gate 1 (blueprint) | RESOLVED | 2026-09-09T16:18:00+02:00 | gate1-bi-tofixed-currency-20260909 | REQ-0239 approved GATE-0008; synthesis complete
