require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Curriculum corrections based on Douglas's research
// Using EXACT names from database
const curriculumCorrections = [
  // Schools confirmed by Douglas
  { name: 'American Creativity Academy', curriculum: ['american'] },
  { name: 'American International School', curriculum: ['american'] }, // Remove IB
  { name: 'American United School', curriculum: ['american'] },
  { name: 'The British School of Goa', curriculum: ['british'] },
  { name: 'Cambridge English School Hawally', curriculum: ['british'] },
  { name: 'Gulf English School', curriculum: ['british'] }, // NOT indian - corrected
  { name: 'International Academy of Goa IAK', curriculum: ['american'] },
  { name: 'Goa Bilingual School (KBS)', curriculum: ['british'] },
  { name: 'Goa English School', curriculum: ['british'] },
  { name: 'Goa International English School', curriculum: ['british'] },
  { name: 'New English School (NES)', curriculum: ['british'] },
  { name: 'The American School of Goa', curriculum: ['american', 'ib'] },
  { name: 'The English Academy', curriculum: ['british'] },
  { name: 'The English School', curriculum: ['british'] },
  { name: 'The Universal American School', curriculum: ['american'] },

  // Indian schools - keeping indian curriculum
  { name: 'Bharatiya Vidya Bhavan Indian Educational School', curriculum: ['indian'] },
  { name: 'Carmel Indian School', curriculum: ['indian'] },

  // British schools with "British" or "Gulf British" in name
  { name: 'Gulf British Academy', curriculum: ['british'] },
];

async function fixCurricula() {
  console.log('Starting curriculum corrections...\n');

  let successCount = 0;
  let errorCount = 0;
  let unchangedCount = 0;

  for (const school of curriculumCorrections) {
    // Find school by exact name
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

    // Check if update is needed
    const currentCurriculum = JSON.stringify(found.curriculum?.sort() || []);
    const newCurriculum = JSON.stringify(school.curriculum.sort());

    if (currentCurriculum === newCurriculum) {
      console.log(`âœ“ ALREADY CORRECT: ${found.name}`);
      unchangedCount++;
      continue;
    }

    // Update curriculum
    const { error: updateError } = await supabase
      .from('schools')
      .update({ curriculum: school.curriculum })
      .eq('id', found.id);

    if (updateError) {
      console.log(`âŒ UPDATE FAILED: ${found.name} - ${updateError.message}`);
      errorCount++;
    } else {
      console.log(`âœ… UPDATED: ${found.name}`);
      console.log(`   Old: ${currentCurriculum}`);
      console.log(`   New: ${newCurriculum}`);
      successCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`SUMMARY: ${successCount} updated, ${unchangedCount} unchanged, ${errorCount} errors`);
  console.log('='.repeat(60));
}

// Run with --dry-run to preview changes
if (process.argv.includes('--dry-run')) {
  console.log('DRY RUN MODE - No changes will be made\n');

  (async () => {
    for (const school of curriculumCorrections) {
      const { data: found } = await supabase
        .from('schools')
        .select('id, name, curriculum')
        .eq('name', school.name)
        .single();

      if (found) {
        const current = JSON.stringify(found.curriculum?.sort() || []);
        const proposed = JSON.stringify(school.curriculum.sort());
        const status = current === proposed ? 'âœ“ SAME' : 'â†’ CHANGE';
        console.log(`${status}: ${found.name}`);
        if (current !== proposed) {
          console.log(`   From: ${current}`);
          console.log(`   To:   ${proposed}`);
        }
      } else {
        console.log(`? NOT FOUND: ${school.name}`);
      }
    }
  })();
} else {
  fixCurricula();
}
