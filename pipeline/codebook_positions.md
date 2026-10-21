# Codebook: positions and recommendations (second pass)

## Positions on FDA's proposals
For each proposal below, record the comment's stance. Use exactly one of:
- "support": endorses the proposal as described, or with minor tweaks.
- "conditional": supports it only with substantial conditions, limits, or safeguards the comment treats as necessary.
- "oppose": argues against it, says it is insufficient or inappropriate, or calls for a materially different approach.
- null: the comment does not take a position on it. Mentioning a topic without an evaluative stance is null.

Proposals (key: description, related questions):
- risk_framework: FDA's two-axis risk framework (device activity x consequence of relying on incorrect output) as the basis for risk assessment (Q1). Adding dimensions while keeping the framework = conditional. Rejecting it = oppose.
- competency_eval: Competency-based premarket evaluation, i.e., device benchmarking followed by clinical confirmation (Q7, Q9).
- confirmation_flex: Clinical confirmation that does not always require a prospective clinical study, scaled to risk (Q11).
- synthetic_data: Using synthetic data to supplement real-world data in evaluation (Q12, Q13).
- third_party: Involving independent third parties in benchmarking or clinical confirmation (Q16).
- postmarket_tradeoff: Accepting greater premarket uncertainty in exchange for stronger postmarket monitoring (Q18).
- supervisory_agents: Using machine-based supervisory agents (AI monitoring AI) for postmarket monitoring (Q20).
- flexible_change_control: Adapting PCCPs or other change control so GenAI devices can change without new premarket review when modifications cannot be fully prespecified (Q22, Q23).
- voluntary_model_files: Relying on voluntary Foundation Model Master Files from foundation model developers (Q25). Calling for mandatory disclosure instead = oppose.

## Recommendations
List the concrete recommendations the comment makes to FDA (things it asks FDA or manufacturers to do). Rules:
- Each is a short imperative phrase, 3 to 12 words, in plain language (e.g., "Test devices across realistic multi-turn conversations", "Require version pinning of foundation models", "Create a patient channel for reporting AI harms").
- One recommendation per distinct ask. Do not split one ask into many, and do not merge unrelated asks.
- Up to 10 per comment, the most substantive first. General statements of concern are not recommendations.
- Comments with no concrete asks get an empty list.
