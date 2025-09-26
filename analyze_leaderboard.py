#!/usr/bin/env python3
"""
Analyze AFL tipping data to calculate full season totals
"""

from collections import defaultdict

def count_tips_from_data():
    """Count all tips from the provided dataset"""
    
    # Manual count from the provided data - counting each tipper's tips by round
    tipper_counts = {
        "Granny": {"correct": 0, "total": 0},
        "James": {"correct": 0, "total": 0}, 
        "Leo": {"correct": 0, "total": 0},
        "Mat": {"correct": 0, "total": 0},
        "Mumma and Halle": {"correct": 0, "total": 0},
        "Poppy": {"correct": 0, "total": 0}
    }
    
    # Round 0 (Pre-season/Test matches)
    # Match 208: SYD vs HAW (Winner: HAW)
    tipper_counts["Granny"]["total"] += 1  # Tipped SYD (incorrect)
    tipper_counts["James"]["total"] += 1   # Tipped HAW (correct)
    tipper_counts["James"]["correct"] += 1
    tipper_counts["Leo"]["total"] += 1     # Tipped SYD (incorrect)
    tipper_counts["Mat"]["total"] += 1     # Tipped SYD (incorrect)
    tipper_counts["Mumma and Halle"]["total"] += 1  # Tipped SYD (incorrect)
    tipper_counts["Poppy"]["total"] += 1   # Tipped HAW (correct)
    tipper_counts["Poppy"]["correct"] += 1
    
    # Match 209: GWS vs COL (Winner: GWS)
    tipper_counts["Granny"]["total"] += 1  # Tipped COL (incorrect)
    tipper_counts["James"]["total"] += 1   # Tipped COL (incorrect)
    tipper_counts["Leo"]["total"] += 1     # Tipped GWS (correct)
    tipper_counts["Leo"]["correct"] += 1
    tipper_counts["Mat"]["total"] += 1     # Tipped COL (incorrect)
    tipper_counts["Mumma and Halle"]["total"] += 1  # Tipped COL (incorrect)
    tipper_counts["Poppy"]["total"] += 1   # Tipped GWS (correct)
    tipper_counts["Poppy"]["correct"] += 1
    
    # Round 1 - Count all matches from the data
    round1_matches = [
        # Match 210: RIC vs CAR (Winner: RIC) - All tipped CAR (incorrect)
        ("CAR", "RIC", ["Granny", "James", "Leo", "Mat", "Mumma and Halle", "Poppy"]),
        # Match 211: HAW vs ESS (Winner: HAW)
        ("HAW", "HAW", ["Granny", "James", "Mat", "Mumma and Halle", "Poppy"]),  # Correct
        ("ESS", "HAW", ["Leo"]),  # Incorrect
        # Match 212: GEE vs FRE (Winner: GEE) - All tipped GEE (correct)
        ("GEE", "GEE", ["Granny", "James", "Leo", "Mat", "Mumma and Halle", "Poppy"]),
        # Match 213: SYD vs BRL (Winner: BRL) - All tipped BRL (correct)
        ("BRL", "BRL", ["Granny", "James", "Leo", "Mat", "Mumma and Halle", "Poppy"]),
        # Match 214: WB vs NM (Winner: WB) - All tipped WB (correct)
        ("WB", "WB", ["Granny", "James", "Leo", "Mat", "Mumma and Halle", "Poppy"]),
        # Match 215: COL vs PA (Winner: COL)
        ("PA", "COL", ["Granny", "James", "Leo"]),  # Incorrect
        ("COL", "COL", ["Mat", "Mumma and Halle", "Poppy"]),  # Correct
        # Match 216: ADL vs STK (Winner: ADL) - All tipped ADL (correct)
        ("ADL", "ADL", ["Granny", "James", "Leo", "Mat", "Mumma and Halle", "Poppy"]),
        # Match 217: MEL vs GWS (Winner: GWS) - All tipped GWS (correct)
        ("GWS", "GWS", ["Granny", "James", "Leo", "Mat", "Mumma and Halle", "Poppy"]),
        # Match 218: WC vs GC (Winner: GC)
        ("GC", "GC", ["Granny", "Leo", "Mat", "Mumma and Halle", "Poppy"]),  # Correct
        ("WC", "GC", ["James"]),  # Incorrect
    ]
    
    # Process Round 1
    for tip, winner, tippers in round1_matches:
        for tipper in tippers:
            tipper_counts[tipper]["total"] += 1
            if tip == winner:
                tipper_counts[tipper]["correct"] += 1
    
    # Round 2 - Process all matches
    round2_matches = [
        # Match 219: CAR vs HAW (Winner: HAW)
        ("HAW", "HAW", ["Granny", "James", "Mat", "Mumma and Halle", "Poppy"]),  # Correct
        ("CAR", "HAW", ["Leo"]),  # Incorrect
        # Match 220: WB vs COL (Winner: COL)
        ("COL", "COL", ["Granny", "James", "Mat", "Mumma and Halle", "Poppy"]),  # Correct
        ("WB", "COL", ["Leo"]),  # Incorrect
        # Match 221: ESS vs ADL (Winner: ADL) - All tipped ADL (correct)
        ("ADL", "ADL", ["Granny", "James", "Leo", "Mat", "Mumma and Halle", "Poppy"]),
        # Match 222: PA vs RIC (Winner: PA) - All tipped PA (correct)
        ("PA", "PA", ["Granny", "James", "Leo", "Mat", "Mumma and Halle", "Poppy"]),
        # Match 223: STK vs GEE (Winner: STK) - All tipped GEE (incorrect)
        ("GEE", "STK", ["Granny", "James", "Leo", "Mat", "Mumma and Halle", "Poppy"]),
        # Match 224: BRL vs WC (Winner: BRL) - All tipped BRL (correct)
        ("BRL", "BRL", ["Granny", "James", "Leo", "Mat", "Mumma and Halle", "Poppy"]),
        # Match 225: NM vs MEL (Winner: NM) - All tipped MEL (incorrect)
        ("MEL", "NM", ["Granny", "James", "Leo", "Mat", "Mumma and Halle", "Poppy"]),
        # Match 226: FRE vs SYD (Winner: SYD)
        ("FRE", "SYD", ["Granny", "Mat", "Mumma and Halle"]),  # Incorrect
        ("SYD", "SYD", ["James", "Leo", "Poppy"]),  # Correct
    ]
    
    # Process Round 2
    for tip, winner, tippers in round2_matches:
        for tipper in tippers:
            tipper_counts[tipper]["total"] += 1
            if tip == winner:
                tipper_counts[tipper]["correct"] += 1
    
    # Round 3 - All tipped PA but ESS won (all incorrect)
    for tipper in tipper_counts:
        tipper_counts[tipper]["total"] += 1  # All made tips for round 3
        # All tipped PA but ESS won, so no correct tips added
    
    return tipper_counts

def calculate_leaderboard():
    """Calculate leaderboard from tip data"""
    tipper_stats = defaultdict(lambda: {
        'total_tips': 0,
        'correct_tips': 0,
        'incorrect_tips': 0,
        'success_rate': 0.0,
        'rounds': set()
    })
    
    # Process all tips
    for tip in tip_data:
        tipper = tip['tipper_name']
        tipper_stats[tipper]['total_tips'] += 1
        tipper_stats[tipper]['rounds'].add(tip['match_round'])
        
        if tip['is_correct']:
            tipper_stats[tipper]['correct_tips'] += 1
        else:
            tipper_stats[tipper]['incorrect_tips'] += 1
    
    # Calculate success rates
    for tipper in tipper_stats:
        stats = tipper_stats[tipper]
        if stats['total_tips'] > 0:
            stats['success_rate'] = (stats['correct_tips'] / stats['total_tips']) * 100
        stats['rounds_participated'] = len(stats['rounds'])
    
    # Sort by correct tips (descending), then by name
    leaderboard = sorted(
        tipper_stats.items(),
        key=lambda x: (-x[1]['correct_tips'], x[0])
    )
    
    return leaderboard

def print_leaderboard(leaderboard):
    """Print formatted leaderboard"""
    print("=== AFL TIPPING LEADERBOARD ===")
    print(f"{'Pos':<4} {'Tipper':<20} {'Correct':<8} {'Total':<8} {'Success %':<10} {'Rounds':<8}")
    print("-" * 70)
    
    for pos, (tipper, stats) in enumerate(leaderboard, 1):
        print(f"{pos:<4} {tipper:<20} {stats['correct_tips']:<8} {stats['total_tips']:<8} "
              f"{stats['success_rate']:<10.1f} {stats['rounds_participated']:<8}")

if __name__ == "__main__":
    leaderboard = calculate_leaderboard()
    print_leaderboard(leaderboard)
    
    # Show detailed breakdown
    print("\n=== DETAILED BREAKDOWN ===")
    for tipper, stats in leaderboard:
        print(f"{tipper}: {stats['correct_tips']}/{stats['total_tips']} "
              f"({stats['success_rate']:.1f}%) across {stats['rounds_participated']} rounds")
