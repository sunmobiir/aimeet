export const AVATAR_COLORS = [
  "#17a2a2",
  "#3b82f6",
  "#e5894b",
  "#4f9e5e",
  "#c85c8e",
  "#d9a13b",
  "#5b7fd4",
  "#c2603f",
]

export const NAME_POOL = [
  "Amara Osei",
  "Daniel Reyes",
  "Priya Raghavan",
  "Tomás Beltrán",
  "Nina Kowalski",
  "Wei Chen",
  "Marcus Ainsley",
  "Sofia Lindqvist",
  "Omar Haddad",
  "Grace Mbeki",
  "Ivan Petrov",
  "Hana Sato",
  "Lucas Moreau",
  "Rachel Okonkwo",
  "Jonas Berg",
  "Leila Farsi",
  "Ethan Brooks",
  "Mei Tanaka",
]

export const CHAT_POOL = [
  "Can you go back one slide?",
  "This is really helpful, thanks!",
  "Audio dropped for a second on my end.",
  "Where can we find the recording afterwards?",
  "+1 to that question",
  "Is this deck going to be shared?",
  "Joining from Berlin — great session so far.",
  "Sorry, I have to step away for a few minutes.",
  "Could you zoom in on the chart?",
  "Works on my side now.",
  "What's the timeline for rollout?",
  "Great point about onboarding friction.",
  "I'll drop our notes in the shared pod.",
  "Can we cover pricing before the end?",
]

export const QA_POOL = [
  "How does this compare to what we ran last quarter?",
  "Will there be a self-paced version of this training?",
  "What's the recommended team size for this workflow?",
  "Can external partners be invited into a room?",
  "Is there an export for the poll results?",
  "How long are recordings retained?",
]

export const NOTES_SEED = `AGENDA
1. Welcome + housekeeping (5 min)
2. Q3 product walkthrough (20 min)
3. Live demo — new pod layouts (15 min)
4. Open Q&A (15 min)

ACTION ITEMS
- [ ] Share deck + recording link with attendees
- [ ] Follow up on regional rollout dates
- [ ] Collect feedback via exit poll`

export const ROOM_TEMPLATES = [
  {
    id: "webinar",
    name: "Webinar",
    description: "Large audience, presenter-led. Q&A and polls up front, chat moderated.",
  },
  {
    id: "training",
    name: "Virtual classroom",
    description: "Whiteboard, breakout-style notes and engagement tracking for learners.",
  },
  {
    id: "collaboration",
    name: "Collaboration",
    description: "Everyone on camera, shared notes and whiteboard with equal footing.",
  },
]
