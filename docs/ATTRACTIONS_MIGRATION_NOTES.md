# Attractions Migration Notes

**Created:** November 2025
**Purpose:** Track properties to migrate when Attractions section is built

---

## Properties to Re-extract as Attractions

These were extracted as hotels but should be Attractions:

### 1. Shaab Sea Club
- **Current Location:** Hotels database
- **Google Place ID:** ChIJjQQZqwedzz8RDt9cPwm5Aqo
- **Rating:** 4.0⭐ (484 reviews)
- **Area:** Hawalli/Salmiya
- **Type:** Beach/Sea Club
- **Note:** Not a traditional hotel - day visit attraction with beach facilities

---

## Action Required When Building Attractions

1. Delete these entries from `hotels` table
2. Re-extract using Attractions pipeline
3. Use same Google Place ID for accurate data
4. Update category-specific fields (opening hours, ticket prices, etc.)

---

## Additional Properties to Review

During hotel review, check for other miscategorized properties:
- [ ] Beach clubs
- [ ] Day resorts (not overnight stay)
- [ ] Conference/convention centers only
- [ ] Apartment complexes
- [ ] Entertainment venues with lodging

---

**REMINDER:** When creating Attractions section, search this document for properties to migrate!
