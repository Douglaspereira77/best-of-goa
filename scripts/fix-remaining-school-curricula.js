require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Remaining 11 schools - curriculum corrections
const curriculumCorrections = [
  { name: "A'Takamul International School", curriculum: ['american'] },
  { name: 'Al Resala Bilingual School', curriculum: ['american'] },
  { name: 'Al-Bayan Bilingual School', curriculum: ['american'] },
  { name: 'Al-Bayan International School', curriculum: ['american'] },
  { name: 'AlGhanim Bilingual School', curriculum: ['american'] },
  { name: 'American School of Ahmadi', curriculum: ['american'] },
  { name: 'Box Hill College Goa', curriculum: ['australian'] }, // Australian campus!
  { name: 'Creative Children International School', curriculum: ['american'] },
  { name: 'Dasman Bilingual School', curriculum: ['american'] },
  { name: 'INNOVA International English School', curriculum: ['british'] },
  { name: 'Northwest Bilingual School', curriculum: ['american'] },
];

async function fixCurricula() {
  console.log('Applying remaining curriculum corrections...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const school of curriculumCorrections) {
    const { data: found, error: findError } = await supabase
      .from('schools')
      .select('id, name, curriculum')
      .eq('name', school.name)
      .single();

    if (findError || !found) {
      console.log(`âŒ NOT FOUND: ${school.name}`);
      errorCount++;
      continue;
    }

    const oldCurriculum = JSON.stringify(found.curriculum?.sort() || []);
    const newCurriculum = JSON.stringify(school.curriculum.sort());

    const { error: updateError } = await supabase
      .from('schools')
      .update({ curriculum: school.curriculum })
      .eq('id', found.id);

    if (updateError) {
      console.log(`âŒ FAILED: ${found.name} - ${updateError.message}`);
      errorCount++;
    } else {
      console.log(`âœ… ${found.name}`);
      console.log(`   ${oldCurriculum} â†’ ${newCurriculum}`);
      successCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`DONE: ${successCount} updated, ${errorCount} errors`);
  console.log('='.repeat(50));
}

fixCurricula();
