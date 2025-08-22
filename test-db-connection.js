const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Load environment variables from .env file
const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    envVars.NEXT_PUBLIC_SUPABASE_URL = line.split('=')[1];
  } else if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY = line.split('=')[1];
  }
});

process.env.NEXT_PUBLIC_SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Environment variables loaded:');
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
console.log('KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('Testing connection to profiles table...');

const testQuery = async () => {
  try {
    console.log('Testing basic connection...');
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('Connection error:', error);
      return;
    }

    console.log('Connection successful! Profile count:', data);

    console.log('Testing specific user profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', '94c24cc1-44f4-43d3-ad71-f125f43f1d78')
      .single();

    if (profileError) {
      console.error('Profile query error:', profileError);
    } else {
      console.log('Profile found:', profileData);
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

testQuery().then(() => {
  console.log('Test completed');
  process.exit(0);
}).catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

setTimeout(() => {
  console.log('Test timeout after 10 seconds');
  process.exit(1);
}, 10000);
