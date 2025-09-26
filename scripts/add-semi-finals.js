import { createClient } from '@supabase/supabase-js';

// Hardcoded from your .env file
const supabaseUrl = 'https://vmmoiygjqyydkxrcjtoe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbW9peWdqcXl5ZGt4cmNqdG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1OTk3NjUsImV4cCI6MjA1NzE3NTc2NX0.YIdCxrQ2cNMv6KuysyDLSrDoXJ7n5G9-Kz2SWJwbdbE';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addSemiFinals() {
  try {
    console.log('Adding Semi-Finals matches...');
    
    // First, check if teams exist
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('id, name')
      .in('name', ['Adelaide Crows', 'Hawthorn Hawks', 'Brisbane Lions', 'Gold Coast Suns']);
    
    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      
      // If teams table doesn't exist or is empty, we need to inform the user
      console.log('\nIt looks like the teams table is not set up.');
      console.log('Please run the following SQL in your Supabase dashboard:');
      console.log('1. Go to https://supabase.com/dashboard/project/vmmoiygjqyydkxrcjtoe/sql/new');
      console.log('2. Copy and paste the SQL from: supabase/migrations/20250912_add_semi_finals.sql');
      console.log('3. Click "Run" to execute the migration');
      return;
    }
    
    if (!teams || teams.length !== 4) {
      console.log('Not all teams found. Found:', teams?.map(t => t.name).join(', '));
      console.log('\nPlease run the migration SQL in your Supabase dashboard first.');
      return;
    }
    
    // Get team IDs
    const teamMap = {};
    teams.forEach(team => {
      teamMap[team.name] = team.id;
    });
    
    // Add Semi-Finals matches
    const matches = [
      {
        round: 27,
        venue: 'Adelaide Oval',
        match_date: '2025-09-12T09:10:00Z',
        home_team_id: teamMap['Adelaide Crows'],
        away_team_id: teamMap['Hawthorn Hawks'],
        is_complete: false
      },
      {
        round: 27,
        venue: 'Gabba',
        match_date: '2025-09-13T09:05:00Z',
        home_team_id: teamMap['Brisbane Lions'],
        away_team_id: teamMap['Gold Coast Suns'],
        is_complete: false
      }
    ];
    
    for (const match of matches) {
      const { error } = await supabase
        .from('matches')
        .insert(match);
      
      if (error) {
        console.error('Error inserting match:', error);
      } else {
        console.log(`✓ Added match: ${teams.find(t => t.id === match.home_team_id).name} vs ${teams.find(t => t.id === match.away_team_id).name}`);
      }
    }
    
    console.log('\nSemi-Finals matches added successfully!');
    console.log('You should now see them in your app when you navigate to Round 27.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

addSemiFinals();