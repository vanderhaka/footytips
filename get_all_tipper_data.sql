-- ========================================
-- COMPREHENSIVE TIPPER DATA QUERY
-- ========================================

-- 1. TIPPER TOTALS AND STANDINGS
-- ========================================
SELECT 
  '=== TIPPER STANDINGS ===' as section;

SELECT 
  ROW_NUMBER() OVER (ORDER BY 
    COUNT(CASE WHEN t.is_correct = TRUE THEN 1 END) DESC,
    tp.name ASC
  ) as position,
  tp.name as tipper_name,
  COUNT(DISTINCT t.match_id) as total_tips_made,
  COUNT(CASE WHEN t.is_correct = TRUE THEN 1 END) as correct_tips,
  COUNT(CASE WHEN t.is_correct = FALSE THEN 1 END) as incorrect_tips,
  COUNT(CASE WHEN t.is_correct IS NULL AND t.id IS NOT NULL THEN 1 END) as pending_tips,
  ROUND(
    CASE 
      WHEN COUNT(CASE WHEN t.is_correct IS NOT NULL THEN 1 END) > 0 
      THEN (COUNT(CASE WHEN t.is_correct = TRUE THEN 1 END)::numeric / 
            COUNT(CASE WHEN t.is_correct IS NOT NULL THEN 1 END)::numeric * 100)
      ELSE 0 
    END, 1
  ) as success_rate_pct
FROM tippers tp
LEFT JOIN tips t ON t.tipper_id = tp.id
GROUP BY tp.id, tp.name
ORDER BY correct_tips DESC, tp.name;

-- 2. ROUND BY ROUND BREAKDOWN
-- ========================================
SELECT 
  '=== ROUND BY ROUND BREAKDOWN ===' as section;

SELECT 
  t.round,
  tp.name as tipper_name,
  COUNT(t.id) as tips_in_round,
  COUNT(CASE WHEN t.is_correct = TRUE THEN 1 END) as correct,
  COUNT(CASE WHEN t.is_correct = FALSE THEN 1 END) as incorrect,
  COUNT(CASE WHEN t.is_correct IS NULL THEN 1 END) as pending
FROM tips t
JOIN tippers tp ON tp.id = t.tipper_id
GROUP BY t.round, tp.id, tp.name
ORDER BY t.round DESC, correct DESC, tp.name;

-- 3. ALL TIPS WITH MATCH DETAILS
-- ========================================
SELECT 
  '=== ALL TIPS DETAILED ===' as section;

SELECT 
  t.round,
  tp.name as tipper,
  ht.name || ' vs ' || at.name as match,
  t.team_tipped as tipped,
  m.winner,
  CASE 
    WHEN m.is_complete = FALSE THEN 'Pending'
    WHEN t.is_correct = TRUE THEN '✓ Correct'
    WHEN t.is_correct = FALSE THEN '✗ Wrong'
    ELSE 'Unknown'
  END as result,
  m.home_score || '-' || m.away_score as score,
  to_char(m.match_date, 'DD/MM HH24:MI') as match_time
FROM tips t
JOIN tippers tp ON tp.id = t.tipper_id
JOIN matches m ON m.id = t.match_id
JOIN teams ht ON ht.id = m.home_team_id
JOIN teams at ON at.id = m.away_team_id
ORDER BY t.round DESC, m.match_date, tp.name;

-- 4. MATCHES WITH TIP COUNTS
-- ========================================
SELECT 
  '=== MATCHES AND TIP DISTRIBUTION ===' as section;

SELECT 
  m.round,
  ht.name || ' vs ' || at.name as match,
  m.venue,
  to_char(m.match_date, 'DD/MM HH24:MI') as match_time,
  CASE 
    WHEN m.is_complete THEN 'Complete'
    ELSE 'Upcoming'
  END as status,
  m.home_score || '-' || m.away_score as score,
  m.winner,
  COUNT(CASE WHEN t.team_tipped = ht.name OR t.team_tipped = ht.abbreviation THEN 1 END) as tips_for_home,
  COUNT(CASE WHEN t.team_tipped = at.name OR t.team_tipped = at.abbreviation THEN 1 END) as tips_for_away,
  COUNT(t.id) as total_tips
FROM matches m
LEFT JOIN teams ht ON ht.id = m.home_team_id
LEFT JOIN teams at ON at.id = m.away_team_id
LEFT JOIN tips t ON t.match_id = m.id
GROUP BY m.id, m.round, ht.name, at.name, m.venue, m.match_date, m.is_complete, m.home_score, m.away_score, m.winner
ORDER BY m.round DESC, m.match_date;

-- 5. HEAD TO HEAD COMPARISON
-- ========================================
SELECT 
  '=== HEAD TO HEAD PERFORMANCE ===' as section;

WITH tipper_performance AS (
  SELECT 
    tp.name,
    t.round,
    COUNT(CASE WHEN t.is_correct = TRUE THEN 1 END) as correct_in_round
  FROM tippers tp
  LEFT JOIN tips t ON t.tipper_id = tp.id
  GROUP BY tp.name, t.round
)
SELECT 
  round,
  MAX(CASE WHEN name = (SELECT name FROM tippers ORDER BY name LIMIT 1 OFFSET 0) THEN correct_in_round END) as tipper_1,
  MAX(CASE WHEN name = (SELECT name FROM tippers ORDER BY name LIMIT 1 OFFSET 1) THEN correct_in_round END) as tipper_2,
  MAX(CASE WHEN name = (SELECT name FROM tippers ORDER BY name LIMIT 1 OFFSET 2) THEN correct_in_round END) as tipper_3,
  MAX(CASE WHEN name = (SELECT name FROM tippers ORDER BY name LIMIT 1 OFFSET 3) THEN correct_in_round END) as tipper_4,
  MAX(CASE WHEN name = (SELECT name FROM tippers ORDER BY name LIMIT 1 OFFSET 4) THEN correct_in_round END) as tipper_5
FROM tipper_performance
WHERE round IS NOT NULL
GROUP BY round
ORDER BY round DESC;

-- 6. RAW DATA DUMPS
-- ========================================
SELECT 
  '=== RAW TIPPERS DATA ===' as section;

SELECT * FROM tippers ORDER BY name;

SELECT 
  '=== RAW TIPS DATA ===' as section;

SELECT 
  t.*,
  tp.name as tipper_name
FROM tips t
JOIN tippers tp ON tp.id = t.tipper_id
ORDER BY t.round DESC, t.created_at DESC;

SELECT 
  '=== RAW MATCHES DATA ===' as section;

SELECT 
  m.*,
  ht.name as home_team_name,
  at.name as away_team_name
FROM matches m
JOIN teams ht ON ht.id = m.home_team_id
JOIN teams at ON at.id = m.away_team_id
ORDER BY m.round DESC, m.match_date;