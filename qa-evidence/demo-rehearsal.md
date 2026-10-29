# Owner A: five-minute demo run sheet

Use one feature from `nextjs/saas-starter`, rather than all eight scenarios.
The bundled sample analysis has been removed; first analysis calls live AI, and the same commit then reuses DB results.

| Segment | Duration | Screen and message |
| --- | --- | --- |
| Problem | 40 seconds | Home: finding the files behind an unfamiliar feature is difficult. |
| Approach | 40 seconds | Analyze a repository, then connect a feature to files, code and concepts. |
| Demonstration | 150 seconds | Follow the sequence below. |
| Value and limits | 40 seconds | Explain the verified behavior and limits below. |
| Closing | 30 seconds | Summarize understanding and applying one feature. |

## Demonstration sequence

1. Sign in and analyze the repository (allow time for the first live AI request).
2. Select its login feature and distinguish grounded evidence from AI estimates (20 seconds).
3. Show the screen, logic, server and database flow (25 seconds).
4. Connect the related code excerpt to the concept explanation (30 seconds).
5. Answer a quiz question; show its reason, references and first-answer record (25 seconds).
6. Open the small modification mission, explain its rubric and request grading (25 seconds).
7. Open learning history and show the first quiz result and highest mission score (10 seconds).

Mission grading is an AI estimate from 0 to 100, not code execution. If a live
request fails, show that result instead of presenting cached evidence as a fresh
success.

## Observed rehearsal scope

On October 29, 2026, an independent QA agent traversed home, signup, empty
history, analysis, overview, feature, flow, concept, quiz, mission and history
at 1440x900. The automatic walkthrough lasted 5.359 seconds, not five minutes
of spoken presentation. It observed `saved:true` and a first wrong-answer
history of 0/1. It opened the mission but did not grade during that walkthrough;
the separate submitted S6 did grade successfully.

The pre-integration submitted suite subsequently passed all eight scenarios
in 31.8 seconds after the requested app restart. The final bounded regression
run passed the two account-isolation cases (8.0 and 5.9 seconds); the storage
remount case was interrupted at the cutoff and four cases never started.
These results concern the frozen takeover product, not the integrated commit.

No first-time human observation or timed spoken rehearsal was performed.
The user's response was that they had not checked yet. Deployment validation
must identify the deployed SHA; no local result establishes deployment success.
