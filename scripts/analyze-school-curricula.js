require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyze() {
  const { data: schools, error } = await supabase
    .from('schools')
    .select('id, name, curriculum, school_type, accreditations')
    .eq('active', true)
    .order('name');

  if (error) {
    console.log('Error:', error.message);
    return;
  }

  console.log('Total schools:', schools.length);
  console.log('');
  console.log('='.repeat(80));
  console.log('SCHOOL CURRICULUM ANALYSIS');
  console.log('='.repeat(80));
  console.log('');

  // Group by curriculum combination
  const byCurriculum = {};
  schools.forEach(s => {
    const key = JSON.stringify(s.curriculum?.sort() || []);
    if (!byCurriculum[key]) byCurriculum[key] = [];
    byCurriculum[key].push(s);
  });

  console.log('SCHOOLS GROUPED BY CURRICULUM:');
  console.log('');

  Object.entries(byCurriculum).sort().forEach(([key, schls]) => {
    console.log('Curriculum:', key);
    console.log('Count:', schls.length);
    schls.forEach(s => {
      console.log('  -', s.name, '| Type:', s.school_type || 'N/A');
    });
    console.log('');
  });

  // Schools with potential issues
  console.log('='.repeat(80));
  console.log('POTENTIAL ISSUES TO REVIEW:');
  console.log('='.repeat(80));
  console.log('');

  // Schools with no curriculum
  const noCurriculum = schools.filter(s => !s.curriculum || s.curriculum.length === 0);
  if (noCurriculum.length > 0) {
    console.log('Schools with NO curriculum assigned:');
    noCurriculum.forEach(s => console.log('  -', s.name));
    console.log('');
  }

  // Schools named 'British' but missing british curriculum
  const britishNamed = schools.filter(s =>
    s.name.toLowerCase().includes('british') &&
    (!s.curriculum || !s.curriculum.includes('british'))
  );
  if (britishNamed.length > 0) {
    console.log('Schools with "British" in name but missing british curriculum:');
    britishNamed.forEach(s => console.log('  -', s.name, '| Has:', JSON.stringify(s.curriculum)));
    console.log('');
  }

  // Schools named 'American' but missing american curriculum
  const americanNamed = schools.filter(s =>
    s.name.toLowerCase().includes('american') &&
    (!s.curriculum || !s.curriculum.includes('american'))
  );
  if (americanNamed.length > 0) {
    console.log('Schools with "American" in name but missing american curriculum:');
    americanNamed.forEach(s => console.log('  -', s.name, '| Has:', JSON.stringify(s.curriculum)));
    console.log('');
  }

  // Schools named 'Indian' but missing indian curriculum
  const indianNamed = schools.filter(s =>
    s.name.toLowerCase().includes('indian') &&
    (!s.curriculum || !s.curriculum.includes('indian'))
  );
  if (indianNamed.length > 0) {
    console.log('Schools with "Indian" in name but missing indian curriculum:');
    indianNamed.forEach(s => console.log('  -', s.name, '| Has:', JSON.stringify(s.curriculum)));
    console.log('');
  }

  // Schools with IB in name but missing ib curriculum
  const ibNamed = schools.filter(s =>
    (s.name.toLowerCase().includes(' ib ') || s.name.toLowerCase().includes('international baccalaureate')) &&
    (!s.curriculum || !s.curriculum.includes('ib'))
  );
  if (ibNamed.length > 0) {
    console.log('Schools with "IB" in name but missing ib curriculum:');
    ibNamed.forEach(s => console.log('  -', s.name, '| Has:', JSON.stringify(s.curriculum)));
    console.log('');
  }
}

analyze();
