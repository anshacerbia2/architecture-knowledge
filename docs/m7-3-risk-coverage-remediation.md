# M7.3 Focused Risk-Coverage Remediation

Date: 2026-09-25 (Asia/Jakarta). Status: implementation in progress on
`fix/m7-3-risk-coverage`; focused closure and owner completion remain pending.
This work responds only to [M7.3-AUD-001 and M7.3-AUD-002](m7-3-post-merge-audit-report.md).

## Disposition

| Finding | Implemented change | Remaining decision |
| --- | --- | --- |
| M7.3-AUD-001 | Populate `risks` from applicable, option-scoped guide `risk_questions`; preserve the exact question, option IDs and claim IDs; label each entry as a potential area to investigate, unverified for the project. Render a dedicated risk section and explain empty results. | Focused re-audit must decide whether these explicitly qualified risk inquiries satisfy the pilot promise. They are not project-observed risk findings or probabilities. |
| M7.3-AUD-002 | Rename the intake step to evidence focus and explain that quality-attribute selection adds a decision-basis trace without ranking or changing option eligibility. | Verify UI wording with a human pilot before claiming usability improvement. |

## Evidence and authority boundary

The three existing proposed guides already contain `risk_questions` with
`affected_option_ids`, `conditions` and `claim_ids`. The evaluator emits an
entry only for a viable option when every question condition is confirmed true.
It carries that binding's claim IDs into the recommendation inventory, source
closure and separately validated output. A false or unknown condition does not
activate the risk entry. Non-affirmative results carry no viable-option risk
entry. The question is preserved as an inquiry; its claim does not establish
that a risk materialized for the user's project.

The dedicated UI section is titled "Potential risks to investigate". If no
question applies, it says that no applicable risk inquiry is recorded and does
not imply an absence of risk. The existing verification questions remain
visible; risk inquiries and verification prompts can intentionally repeat the
same guide question because the contract has distinct output fields. This is a
bounded pilot presentation, not quantified risk analysis or evidence of testing.

No guide, source, claim, schema, ID, or lifecycle state changes. No provider,
database, persistence, ADR/RFC/PAD generator, or automated decision approval is
introduced. The guide content remains `proposed`.

## Verification boundary

Focused runtime tests check one-option risk scope, two-option risk scope,
non-affirmative absence, and all three real guides. The existing 256 complete
condition combinations retain semantic output validation. Atlas browser tests
check option/claim provenance and risk presentation. Full kernel, Atlas,
mutation and exact-SHA CI results must be recorded at handoff, separating
local database skips from hosted integration evidence.

Successful tests and mutation scores are technical evidence only. A focused
review should inspect whether the qualified inquiry presentation adequately
resolves the audit finding; any demand for independently stated risk
propositions would require a separately governed guide/schema migration or
new evidence-bound content, not a silent question-to-fact conversion.
