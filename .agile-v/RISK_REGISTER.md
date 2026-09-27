# Risk Register

| RISK-ID | REQ | Description | Likelihood | Impact | Mitigation | Status |
|---------|-----|-------------|------------|--------|------------|--------|
| R-001 | REQ-0001 | removeChild regression on new Select | Med | Med | DeferredSelectGate on new Selects | open |
| R-002 | REQ-0005 | Groq rate limit / billing | Low | Med | Fallback chain + 503 mapping | accepted |
| R-003 | REQ-0007 | Notification UI regression | Med | Low | DropdownMenu portal | mitigated |
| R-004 | REQ-0009 | Sentry case 1 product error | Med | Med | Monitor 24h post-deploy | open |
| R-005 | REQ-0229 | Transitive `overrides` may disagree with package peers | Med | High | Prefer same-major bumps first; override only when audit has no compatible direct path; full lint/test/invalidate/build + smoke auth/export/image | open |
| R-006 | REQ-0228 | Local Node still 22.x while engines pin 24.x | Med | Med | Upgrade local/CI to Node 24 before claiming build evidence; Vercel uses engines at build | open |
| R-007 | REQ-0229 | Residual advisory with no non-breaking fix (exceljs/uuid class) | Low | Med | Override uuid ≥11.1.1; never force-downgrade exceljs; escalate to Gate 1 if audit ≠ 0 | open |
