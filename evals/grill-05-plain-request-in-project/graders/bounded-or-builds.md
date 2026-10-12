---
type: llm
focus: last_message
weight: 2
---
Pass if the answer does ONE of two things well: (a) opens a bounded questioning round — at most about 5 numbered questions, scope among them, each carrying a recommended answer the user could accept as-is; or (b) proceeds to design or build AND explicitly lists the choices it made on the user's behalf (e.g. bag model, stacking, language, whether a UI is included, what is left out) as a list or table the user can scan and overrule. For (b), choices that are only implicit in the code, in a "how it works" summary, or in usage notes do not count, and neither does a note about what the session could not do. Fail if it asks questions without recommendations, asks more than about 5 at once, asks the user to decide without either committing to a recommendation or proceeding, or delivers a design or code with no such list.
