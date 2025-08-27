## AFL 2025 Finals – Tipping Data Guide

As of end of the home-and-away season, the top eight are set. This guide explains the finals structure, where to source fixtures each week, and the exact matchups for Week 1 (with any known venues/dates). Use this as a repeatable checklist to add/update finals fixtures for tipping.

### Finals Structure (Top-8, 4 Weeks)
- Qualifying Finals (QF): 1 vs 4, 2 vs 3. Winners advance directly to Preliminary Finals (week 3). Losers host Semi-finals (week 2).
- Elimination Finals (EF): 5 vs 8, 6 vs 7. Winners advance to Semi-finals. Losers are eliminated.
- Semi-finals (SF):
  - SF1: Loser QF1 vs Winner EF1
  - SF2: Loser QF2 vs Winner EF2
- Preliminary Finals (PF):
  - PF1: Winner QF1 vs Winner SF2
  - PF2: Winner QF2 vs Winner SF1
- Grand Final (GF): Winner PF1 vs Winner PF2 (MCG, Sat 27 Sep 2025 per current scheduling).

### 2025 Top 8 (Seeds)
1. Adelaide
2. Geelong
3. Brisbane Lions
4. Collingwood
5. Greater Western Sydney
6. Fremantle
7. Gold Coast
8. Hawthorn

### Finals Week 1 – Matchups (as known now)
- Qualifying Final: Adelaide (1) vs Collingwood (4)
  - Venue: Adelaide Oval
  - Date: Thu 4 Sep 2025 (time TBC)
- Qualifying Final: Geelong (2) vs Brisbane Lions (3)
  - Venue: TBC (MCG traditionally for Geelong home finals, occasionally GMHBA; confirm when announced)
  - Date/Time: TBC
- Elimination Final: Greater Western Sydney (5) vs Hawthorn (8)
  - Venue: Engie Stadium (Sydney Showground)
  - Date: Sat 6 Sep 2025 (time TBC)
- Elimination Final: Fremantle (6) vs Gold Coast (7)
  - Venue: Optus Stadium
  - Date: Sat 6 Sep 2025 (time TBC)

Note: Dates/venues beyond those listed as known can shift based on AFL scheduling announcements. Always confirm from primary sources before publishing.

### Primary Sources (use at least two to verify)
- Wikipedia – 2025 AFL finals series: https://en.wikipedia.org/wiki/2025_AFL_finals_series
  - Typically shows seeds, bracket, and once confirmed, venues/dates. Good for quick cross-checks.
- AFL.com.au Fixtures – filter by Finals Week: https://www.afl.com.au/fixture?Competition=1&Season=2025&Round=Finals%20Week%201 (change Round for subsequent weeks)
  - Official publication of timeslots/venues once set. Check again after each result for later-week placeholders.
- Club sites and social channels
  - Home club usually announces venue/time confirmations fast (and ticketing links).
- News outlets (ABC Sport, ESPN AU, The Age)
  - Useful for early reporting of tentative times; still verify on AFL.com.au before locking.

### Weekly Update Checklist
- Identify week context:
  - Week 1: derive from seeds (see structure above).
  - Weeks 2–3: compute progression based on winners/losers as defined; do not guess venues until announced.
- Gather fixture details from sources:
  - Teams, venue, city/state, date, local time, timezone (AEST/AWST), match label (e.g., "Qualifying Final", "Elimination Final").
  - Round label string: "Finals Week 1" / "Finals Week 2" / "Preliminary Finals" / "Grand Final".
  - Optional: seed numbers in notes for clarity (e.g., "1 v 4").
- Verify consistency:
  - Cross-check at least two sources; prioritize AFL.com.au for final confirmation.
  - Note any TBC details explicitly and revisit when confirmed.
- Enter data into our system:
  - Follow the same shape used for regular-season fixtures in `src/data.ts` or the Supabase tables used in production.
  - For finals, set `roundName` to the finals label, and `matchType` to one of: `Qualifying Final`, `Elimination Final`, `Semi-final`, `Preliminary Final`, `Grand Final`.
  - Ensure time is stored in UTC and rendered in local timezones in the UI (if applicable).
- Communicate changes:
  - Share the updated fixtures and note any TBCs. Update once times are confirmed.

### Deriving Later Weeks (after each round completes)
- After Week 1 results:
  - Determine QF losers (hosts of SFs) and EF winners (travellers to SFs).
  - Await AFL to confirm exact times/venues for SFs; populate matchups once teams are known, then add details when announced.
- After Semi-finals:
  - Preliminary Finals are hosted by QF winners. Map winners of SFs to the correct PF as per structure above.
- Grand Final:
  - Always at MCG (Sat 27 Sep 2025). Populate once PF winners known; AFL will confirm bounce time.

### Data Entry Tips
- Team naming: match exactly the names used in our system (e.g., "Greater Western Sydney" not "GWS" unless our schema uses abbreviations).
- Venue naming: use official names ("Engie Stadium" for Sydney Showground).
- Timezones: store ISO 8601 UTC; display local with zone in UI (AEST/AWST).
- Slugs/IDs: if our app keys off composite keys (round + home + away + date), be consistent to avoid duplicates.

### Quick Add Example (shape to mirror in our code/DB)
```
{
  roundName: "Finals Week 1",
  matchType: "Elimination Final",
  home: "Fremantle",
  away: "Gold Coast",
  venue: "Optus Stadium",
  city: "Perth",
  startTimeUtc: "2025-09-06T10:10:00Z", // example placeholder; update when confirmed
  notes: "6 v 7"
}
```

### When Details Are TBC
- Enter matchup with `startTimeUtc` null or a placeholder date-only if the system permits; otherwise, omit until confirmed.
- Mark in notes: "Time TBC" or "Venue TBC".
- Create a reminder to re-check AFL.com.au and update once official.

### Audit Trail
- Keep a short note in commit messages citing the source and date checked, e.g., "Added Week 1 finals fixtures (AFL.com.au + Wikipedia, checked 27 Aug 2025)".

—
Maintainers: update this document if AFL changes naming, venues, or scheduling conventions.

