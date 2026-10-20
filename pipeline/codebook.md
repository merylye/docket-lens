# Codebook: FDA-2026-N-7874 comment coding

## FDA discussion paper questions (abbreviated)
Section IV, Assessment of Risk
Q1 Two-axis risk framework (device activity x consequence of relying on incorrect output); other risk dimensions
Q2 Spectrum from non-directive to action-directing informational outputs; output characteristics as risk modifiers
Q3 Patient-facing vs HCP-facing clinical information; safeguards when users lack domain knowledge
Q4 Generalist vs specialist physicians as users of HCP-facing functions
Q5 Multi-turn conversational devices that drift toward action-directing output; risk across conversational trajectories
Q6 Care escalation functions; under- vs over-escalation
Section V, Competency-Based Premarket Evaluation
Q7 Is benchmarking followed by clinical confirmation an appropriate framework
Q8 How the risk framework sets the level of premarket evidence
Q9 Adequacy and structure of the benchmark elements (knowledge, analysis, safety, communication, generalizability); external standards
Q10 Benchmark validity: contamination, saturation, construct validity, sponsor-developed benchmarks
Q11 Clinical confirmation approaches short of prospective studies; selecting and justifying them
Q12 Statistically meaningful performance measurement; combining synthetic and real data
Q13 Where synthetic data is suited or inadequate; same-class-model synthetic data risks
Q14 Comparators and acceptance criteria for open-ended outputs; clinician panels; human-AI team performance
Q15 Comparing against care likely in the device's absence (delayed care, no intervention)
Q16 Independent third-party involvement in benchmarking/confirmation; qualifications; competition concerns
Q17 Applying the approach to other architectures (vision-language, world models)
Section VI, Postmarket Monitoring
Q18 Accepting greater premarket uncertainty with more postmarket monitoring
Q19 Postmarket approaches: re-benchmarking, clinician sample review, degradation monitoring; cadence and triggers
Q20 Machine-based supervisory agents for monitoring; their reliability
Q21 Roles of clinicians, institutions, societies, standards bodies without diffusing manufacturer accountability
Q22 Scaling re-evaluation to modifications; QMS vs premarket review; PCCP-eligible changes
Q23 Adapting PCCP/change control when future modifications cannot be prespecified
Q24 Third-party foundation model changes; detection and contractual/technical mechanisms
Section VII, Other Topics
Q25 Voluntary Foundation Model Master Access Files; alternatives for foundation model information
Q26 Agentic GenAI devices: autonomous multi-step action, tool use, reduced human review

## Rules
- questions_cited: question numbers the comment explicitly names (e.g., "Q7", "Question 10").
- questions_addressed: questions the comment SUBSTANTIVELY addresses, cited or not. Substantive = at least a paragraph of discussion or a concrete recommendation on that question's topic. A passing sentence does not count. Every cited question that is also substantively discussed goes here; a cited question with no real discussion does not.
- emergent_topics: 0-5 short lowercase tags (2-4 words) for substantive themes NOT captured by any of Q1-Q26 (e.g., "liability allocation", "health equity", "data privacy", "interoperability", "pediatric use", "promotional claims"). Reuse wording across comments where the idea is the same.
- commenter_type: one of: Device industry; Private industry (non-device); Health professional; Health care association; Academia; Individual; Government; Advocacy / nonprofit; Drug industry; International industry; Other. Use the Regulations.gov category when present (map it). When absent, infer from content and signature and set type_inferred true.
- org: submitting organization if identifiable, else "" (do not put private individuals' names here).
- domain: main clinical application area the comment focuses on, one of: General / cross-cutting; Mental and behavioral health; Radiology / imaging; Clinical documentation; Clinical decision support; Patient-facing information; Other.
- summary: one sentence, your own words, under 30 words.
- words: approximate total word count of comment plus attachments.
- unreadable: true if the substance could not be read (e.g., image-only attachment).
