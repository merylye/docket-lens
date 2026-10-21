# Codebook: positions and recommendations (second pass)

## Positions on FDA's proposals
For each proposal below, record the comment's stance. Use exactly one of:
- "support": endorses the proposal as described, or with minor tweaks.
- "conditional": supports it only with substantial conditions, limits, or safeguards the comment treats as necessary.
- "oppose": argues against it, says it is insufficient or inappropriate, or calls for a materially different approach.
- null: the comment does not take a position on it. Mentioning a topic without an evaluative stance is null.

General rules:
- Code what the comment argues, not what it mentions. A comment can be null on most proposals.
- "conditional" means the comment accepts the proposal but treats specific added requirements or limits as necessary. Suggesting optional refinements while endorsing it is "support".
- "oppose" includes saying the proposal is insufficient, unworkable, or should be replaced by a materially different approach.
- A comment that addresses the question but takes no side on the proposal as framed here is null.

Proposals, in docket question order (key: what FDA proposes or asks about; how to code):
- risk_framework (Q1): FDA's two-axis risk framework (device activity x consequence of relying on an incorrect output) as the basis for risk assessment. Keeping the framework but requiring added dimensions or modifiers = conditional. Rejecting it or calling for a different basis = oppose.
- directiveness_continuum (Q2): Treating directiveness as a continuum, with output characteristics (wording, specificity, personalization, context) acting as modifiers of an informational function's risk. Endorsing this = support. Endorsing it only with required guardrails, e.g., saying disclaimers or "non-directive" labels cannot lower risk on their own, or that FDA must set bright-line thresholds within the continuum = conditional. Arguing for a binary distinction, or that output wording should not affect risk classification = oppose.
- patient_facing_risk (Q3): Treating GenAI functions that deliver clinical information to patients, rather than to HCPs, as potentially presenting higher risk that calls for added safeguards. Agreeing patient-facing use raises risk and needs safeguards = support. Agreeing only in some contexts or only with specific limits that protect patient access = conditional. Arguing patient-facing use should not be treated as higher risk, or that it would underestimate patients = oppose.
- trajectory_risk (Q5): Assessing risk of multi-turn conversational devices across realistic conversational trajectories (drift from non-directive to action-directing), rather than single outputs. Endorsing trajectory- or conversation-level evaluation = support. Endorsing it with required specific methods or limits = conditional. Arguing single-output or intended-use assessment is enough, or that trajectory assessment is unworkable = oppose.
- escalation_errors (Q6): Evaluating care escalation functions for both under-escalation and over-escalation, weighted by clinical context. Endorsing two-directional evaluation = support. Endorsing it while requiring a fixed priority (e.g., under-escalation must always weigh more) or other specific conditions = conditional. Arguing one direction should be ignored or that this evaluation is inappropriate = oppose.
- competency_eval (Q7, Q9): Competency-based premarket evaluation, i.e., device benchmarking followed by clinical confirmation.
- confirmation_flex (Q11): Clinical confirmation that does not always require a prospective clinical study, scaled to risk. Saying prospective studies should be required for most or all such devices = oppose.
- synthetic_data (Q12, Q13): Using synthetic data to supplement real-world data in evaluation. Saying synthetic data should not count as evidence = oppose.
- median_clinician_comparator (Q14): Accepting the performance of a typical (median) clinician in practice, rather than only the standard of care, as a comparator for open-ended outputs. Accepting real-world or median clinician performance as the benchmark = support. Accepting it only alongside the standard of care, or only in specified settings = conditional. Requiring the standard of care or expert or specialist performance as the bar instead = oppose. Comments that discuss comparators without addressing this choice are null.
- no_care_comparator (Q15): Assessing performance relative to what would likely happen without the device (unaided judgment, delayed specialist review, no intervention). Endorsing such comparators = support. Allowing them only with specific justification or evidence, e.g., population data showing the alternative is truly no or delayed care = conditional. Arguing devices must meet clinical standards regardless of access gaps, or that "better than nothing" is an inappropriate comparator = oppose.
- third_party (Q16): Involving independent third parties in benchmarking or clinical confirmation.
- postmarket_tradeoff (Q18): Accepting greater premarket uncertainty in exchange for stronger postmarket monitoring.
- postmarket_methods (Q19): FDA's proposed postmarket performance approaches: periodic re-benchmarking, sample-based clinician review, and performance degradation monitoring. Endorsing these, possibly suggesting further optional approaches = support. Endorsing them only if specific additions are required (e.g., mandated cadence or triggers, patient-reported harms, public reporting) = conditional. Calling them inadequate or inappropriate = oppose.
- supervisory_agents (Q20): Using machine-based supervisory agents (AI monitoring AI) for postmarket monitoring.
- flexible_change_control (Q22, Q23): Adapting PCCPs or other change control so GenAI devices can change without new premarket review when modifications cannot be fully prespecified.
- voluntary_model_files (Q25): Relying on voluntary Foundation Model Master Files from foundation model developers. Calling for mandatory disclosure instead = oppose.
- agentic_oversight (Q26): Applying stricter acceptance criteria and oversight to agentic devices (autonomous multi-step action, tool use, reduced human review) than to non-agentic devices. Agreeing agentic devices need stricter criteria or oversight = support. Agreeing only with specific requirements (e.g., human approval gates, action limits) = conditional. Saying agentic devices should not be cleared at all also counts as support. Arguing no added requirements are needed = oppose.

## Recommendations
List the concrete recommendations the comment makes to FDA (things it asks FDA or manufacturers to do). Rules:
- Each is a short imperative phrase, 3 to 12 words, in plain language (e.g., "Test devices across realistic multi-turn conversations", "Require version pinning of foundation models", "Create a patient channel for reporting AI harms").
- One recommendation per distinct ask. Do not split one ask into many, and do not merge unrelated asks.
- Up to 10 per comment, the most substantive first. General statements of concern are not recommendations.
- Comments with no concrete asks get an empty list.
