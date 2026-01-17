# Scripts Directory

## Directory Structure

### production/
Reusable utilities for ongoing operations:
- `activate-school.js` - Activate/deactivate schools
- `batch-enhance-schools.ts` - Bulk AI enhancement operations
- `list-all-schools.ts` - List all schools in database
- `count-schools.ts` - Count schools by status

**Usage**: These scripts are maintained and safe to use in production workflows.

### diagnostics/
Useful diagnostic and inspection tools:
- `check-school-content.ts` - Verify school data quality
- `check-storage-bucket.ts` - Inspect Supabase Storage buckets
- `list-all-buckets.ts` - List all storage buckets
- `inspect-schools-bucket-structure.ts` - Analyze bucket structure

**Usage**: Use for troubleshooting and data quality checks.

### archive/
Historical scripts from feature development (kept for reference).

- `archive/schools-nov-2025/` - Scripts from November 2025 schools feature development
  - One-off test scripts (`test-*`, `check-*`)
  - Data analysis scripts (`analyze-*`)
  - Temporary data insertion scripts (`add-*-school`)
  - Extraction test scripts

**Usage**: Reference only. Not maintained. May not work with current schema.

## Root-Level Scripts (Legacy)

Scripts in the root `bin/` directory are mostly legacy utilities for restaurants, hotels, malls, and general operations. These predate the organized structure and will be reorganized in future cleanup phases.

## Best Practices

1. **New Scripts**: Add to `production/` if reusable, `diagnostics/` if debugging
2. **Testing**: Create in root `bin/` temporarily, move to appropriate folder when done
3. **Archiving**: When feature is complete, move one-off scripts to `archive/[feature-date]/`
4. **Documentation**: Add script purpose as a comment at the top of each file

## Common Operations

```bash
# Count schools in database
node bin/production/count-schools.ts

# Check school content quality
node bin/diagnostics/check-school-content.ts <school-id>

# List all schools
node bin/production/list-all-schools.ts
```
