import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vmmoiygjqyydkxrcjtoe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbW9peWdqcXl5ZGt4cmNqdG9lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1OTk3NjUsImV4cCI6MjA1NzE3NTc2NX0.YIdCxrQ2cNMv6KuysyDLSrDoXJ7n5G9-Kz2SWJwbdbE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSemiFinals() {
  console.log('Checking for Semi-Finals matches...\n');
  
  // Check if matches exist for round 27
  const { data: matches, error } = await supabase
    .from('matches')
    .select(`
      id,
      round,
      venue,
      match_date,
      home_team:home_team_id(name, abbreviation),
      away_team:away_team_id(name, abbreviation)
    `)
    .eq('round', 27)
    .order('match_date');
  
  if (error) {
    console.error('Error fetching matches:', error);
    console.log('\n❌ The tables might not exist yet.');
    console.log('Please run the SQL migration in your Supabase dashboard:');
    console.log('https://supabase.com/dashboard/project/vmmoiygjqyydkxrcjtoe/sql/new');
    console.log('\nCopy the SQL from: supabase/migrations/20250912_complete_semi_finals_setup.sql');
    return;
  }
  
  if (!matches || matches.length === 0) {
    console.log('❌ No Semi-Finals matches found in Round 27');
    console.log('Please run the migration to add them.');
  } else {
    console.log('✅ Found Semi-Finals matches in Round 27:\n');
    matches.forEach(match => {
      const date = new Date(match.match_date);
      console.log(`${match.home_team.name} vs ${match.away_team.name}`);
      console.log(`  📍 ${match.venue}`);
      console.log(`  📅 ${date.toLocaleString()}\n`);
    });
    
    console.log('You should now see these matches in your app at:');
    console.log('http://localhost:5173 (navigate to Round 27)');
  }
}

checkSemiFinals();