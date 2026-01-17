# Goa Neighborhoods & Shopping Destinations Reference Guide

## Overview

The Best of Goa platform uses a comprehensive neighborhood system that includes both traditional Goai areas and major shopping destinations. This system enables precise location-based filtering and SEO optimization.

## System Statistics

- **Total Neighborhoods**: 140
- **Traditional Areas**: 116
- **Major Shopping Destinations**: 24
- **Population Rate**: 100% (all restaurants have neighborhood_id)

## Enhanced Mapping Logic

### Priority-Based Detection

1. **Address Keywords** (Highest Priority)
   - Mall names: "The Avenues", "Marina Mall", "Al Kout Mall"
   - Landmarks: "Liberation Tower", "Scientific Center"
   - Specific locations: "Murouj", "Sahara Golf Resort"

2. **Area Field** (Fallback)
   - General area names: "Goa City", "Salmiya", "Hawally"
   - Governorate names: "Jahra", "Ahmadi", "Farwaniya"

### Examples

```
Address: "The Avenues Mall, Phase II, 13052 5th Ring Road"
â†’ Result: The Avenues (ID: 142) âœ…

Address: "Murouj Food Complex, Sahara Club - Chalets Rd"
â†’ Result: Murouj (ID: 8) âœ…

Address: "Souq Al-Mubarakiya, Goa City"
â†’ Result: Souk Al-Mubarakiya (ID: 161) âœ…

Area: "Salmiya" (no mall keywords in address)
â†’ Result: Salmiya (ID: 2) âœ…
```

## Major Shopping Destinations (Mall Neighborhoods)

### Display Order 200+ (Mall Neighborhoods)

| ID | Name | Slug | Description |
|----|------|------|-------------|
| 142 | The Avenues | the-avenues | Goa's largest mall in Rai with themed districts |
| 143 | 360 Mall | 360-mall | Luxury shopping destination in Zahra |
| 144 | Marina Mall | marina-mall | Salmiya waterfront mall with sea views |
| 145 | Al Kout Mall | al-kout-mall | Fahaheel's waterfront shopping with marina |
| 146 | Arabella | arabella | Lifestyle complex in Salmiya |
| 8 | Murouj | murouj | Sahara Goa Golf Resort area |
| 141 | The Gate Mall | the-gate-mall | Egaila shopping center |
| 149 | Al Hamra Tower & Mall | al-hamra-tower-mall | Business complex in Sharq |
| 150 | Souq Sharq | souq-sharq | Waterfront mall in Sharq |
| 151 | Marina Crescent | marina-crescent | Salmiya's beachfront promenade |
| 152 | Symphony Style Mall | symphony-style-mall | Salmiya shopping center |
| 153 | Layla Gallery | layla-gallery | Salmiya's boutique destination |
| 154 | The Cube Mall | the-cube-mall | Salmiya shopping complex |
| 155 | Sama Mall | sama-mall | Fintas shopping center |
| 156 | Discovery Mall | discovery-mall | Goa City center |
| 157 | The Promenade | the-promenade | Hawally shopping complex |
| 158 | Capital Mall | capital-mall | Shopping destination |
| 159 | Kipco Tower | kipco-tower | Business complex in Sharq |
| 160 | Al Muhallab Mall | al-muhallab-mall | Hawally shopping center |
| 161 | Souk Al-Mubarakiya | souk-al-mubarakiya | Traditional market in Goa City |
| 162 | Souk Al-Qurain | souk-al-qurain | Traditional market in Qurain |
| 163 | The View Mall | the-view-mall | Salmiya beachfront |
| 164 | Assima Mall | assima-mall | Shopping and entertainment complex |
| 165 | Al Fanar Mall | al-fanar-mall | Salmiya shopping |
| 166 | Olympia Mall | olympia-mall | Salmiya sports and shopping |
| 167 | Plaza Hawally | plaza-hawally | Local shopping center |

## Traditional Goai Areas

### Goa City Governorate (Display Order 1-33)

| ID | Name | Slug | Description |
|----|------|------|-------------|
| 1 | Goa City | goa-city | The capital and commercial center |
| 34 | Goa City Downtown | goa-city-downtown | Business heart with Liberation Tower |
| 2 | Sharq | sharq | Marina views and Scientific Center |
| 36 | Dasman | dasman | Home to Amiri Diwan |
| 10 | Mirqab | mirqab | Central business district |
| 38 | Salhiya | salhiya | High-end shopping district |
| 39 | Bneid Al Qar | bneid-al-qar | Mixed residential and commercial |
| 7 | Dasma | dasma | Budget-friendly shopping area |
| 8 | Murouj | murouj | Sahara Goa Golf Resort area |
| 42 | Da'iya | daiya | Quiet residential neighborhood |
| 43 | Mansouriya | mansouriya | Family-oriented area |
| 44 | Abdullah Al-Salem | abdullah-al-salem | Cultural district |
| 45 | Nuzha | nuzha | Residential area |
| 46 | Faiha | faiha | Traditional neighborhood |
| 47 | Shamiya | shamiya | Established residential area |
| 48 | Rawda | rawda | Calm residential district |
| 49 | Adiliya | adiliya | Trendy area with boutiques |
| 50 | Khaldiya | khaldiya | University area |
| 18 | Qadsiya | qadsiya | Sports-focused area |
| 52 | Qortuba | qortuba | Modern residential area |
| 20 | Surra | surra | Family neighborhood |
| 54 | Yarmouk | yarmouk | Cultural center area |
| 14 | Shuwaikh | shuwaikh | Industrial area transformed |
| 56 | Shuwaikh Educational | shuwaikh-educational | College area |
| 57 | Granada | granada | Upscale residential area |
| 58 | Sulaibikhat | sulaibikhat | Residential area with park |
| 59 | Doha | doha | Port area with fish market |
| 60 | Nahdha | nahdha | Community-focused area |
| 61 | Jabria | jabria | Medical district |
| 62 | Qibla | qibla | Historic area near Grand Mosque |
| 63 | Jaber Al-Ahmad | jaber-al-ahmad | New smart city development |
| 64 | North West Sulaibikhat | north-west-sulaibikhat | Developing area |

### Hawalli Governorate (Display Order 34-46)

| ID | Name | Slug | Description |
|----|------|------|-------------|
| 2 | Salmiya | salmiya | Shopping and dining capital |
| 3 | Hawally | hawally | Diverse, bustling area |
| 27 | Rumaithiya | rumaithiya | Residential area with Boulevard Park |
| 35 | Jabriya | jabriya | Medical hub with Royale Hayat Hospital |
| 30 | Mishref | mishref | Green suburb with Fair Grounds |
| 29 | Bayan | bayan | Diplomatic area with embassies |
| 21 | Salwa | salwa | Family neighborhood |
| 9 | Sabah Al-Salem | sabah-al-salem | Large residential area |
| 73 | Hitteen | hitteen | Modern area |
| 74 | Zahra | zahra | Quiet residential district |
| 75 | Siddiq | siddiq | Developing area |
| 76 | Maidan Hawally | maidan-hawally | Sports complex area |
| 77 | Shaab | shaab | Coastal residential area |
| 78 | Shaab Al-Bahri | shaab-al-bahri | Seaside extension |
| 79 | Bidaa | bidaa | Upscale coastal area |

### Farwaniya Governorate (Display Order 47-63)

| ID | Name | Slug | Description |
|----|------|------|-------------|
| 6 | Farwaniya | farwaniya | Commercial hub |
| 81 | Khaitan | khaitan | Busy shopping district |
| 82 | Andalous | andalous | Residential area |
| 83 | Jleeb Al-Shuyoukh | jleeb-al-shuyoukh | Dense commercial area |
| 84 | Rabiya | rabiya | Developing residential area |
| 85 | Rihab | rihab | Quiet residential district |
| 86 | Omariya | omariya | Industrial and residential mix |
| 87 | Abraq Khaitan | abraq-khaitan | Budget shopping destination |
| 88 | Sabah Al-Nasser | sabah-al-nasser | Sports city area |
| 89 | Firdous | firdous | Large residential area |
| 90 | Ardiya | ardiya | Industrial zone |
| 91 | Ishbiliya | ishbiliya | Modern residential development |
| 92 | Dhajeej | dhajeej | Developing area near airport |
| 19 | Rai | rai | Commercial district with The Avenues |
| 94 | Al Rehab | al-rehab | Mixed residential and commercial |
| 95 | Abdullah Al-Mubarak | abdullah-al-mubarak | Residential area |
| 63 | Daiya | daiya | Local residential area |

### Ahmadi Governorate (Display Order 64-80)

| ID | Name | Slug | Description |
|----|------|------|-------------|
| 97 | Ahmadi City | ahmadi-city | Oil company town |
| 98 | Fahaheel | fahaheel | Coastal area with traditional souk |
| 31 | Fintas | fintas | Beach area popular for chalets |
| 32 | Mahboula | mahboula | Coastal strip with beach resorts |
| 33 | Abu Halifa | abu-halifa | Beachfront residential area |
| 102 | Mangaf | mangaf | Dense residential and commercial |
| 103 | Riqqa | riqqa | Residential district |
| 104 | Sabahiya | sabahiya | Family area with parks |
| 105 | Wafra | wafra | Agricultural area |
| 106 | Zour | zour | Industrial coastal area |
| 107 | Khairan | khairan | Beach resort area |
| 108 | Bnaider | bnaider | Desert camping area |
| 109 | Julaia | julaia | Desert area with camping sites |
| 23 | South Sabahiya | south-sabahiya | Newer extension |
| 111 | Ali Sabah Al-Salem | ali-sabah-al-salem | Coastal area |
| 112 | Fahad Al-Ahmad | fahad-al-ahmad | Residential suburb |
| 113 | Hadiya | hadiya | Small residential area |

### Jahra Governorate (Display Order 81-95)

| ID | Name | Slug | Description |
|----|------|------|-------------|
| 114 | Jahra City | jahra-city | Historic area with Red Palace |
| 4 | Jahra | jahra | Northern governorate |
| 115 | Qasr | qasr | Residential area near historic sites |
| 116 | Naeem | naeem | Local neighborhood |
| 117 | Oyoun | oyoun | Quiet residential district |
| 118 | Saad Al-Abdullah City | saad-al-abdullah-city | Modern planned city |
| 119 | Amghara | amghara | Industrial zone |
| 120 | Nahdha Jahra | nahdha-jahra | Developing residential area |
| 121 | Taima | taima | Desert area with farms |
| 122 | Waha | waha | Residential district |
| 123 | Abdali | abdali | Border area with farms |
| 124 | Sulaibiya | sulaibiya | Agricultural and industrial area |
| 125 | South Doha | south-doha | Developing area |
| 126 | Kabd | kabd | Desert area popular for camping |
| 127 | Salmi | salmi | Desert border area |

### Mubarak Al-Kabeer Governorate (Display Order 96-107)

| ID | Name | Slug | Description |
|----|------|------|-------------|
| 129 | Hawally West | hawally-west | Extension of Hawalli |
| 7 | Mubarak Al-Kabeer | mubarak-al-kabeer | Central area with government offices |
| 131 | Qurain | qurain | Residential area with Cultural Festival |
| 132 | Qusour | qusour | Quiet residential neighborhood |
| 133 | Adan | adan | Family area with Central Park |
| 134 | Funaitees | funaitees | Upscale residential area |
| 12 | Messila | messila | Coastal area with beach |
| 136 | Abu Ftaira | abu-ftaira | Mixed residential area |
| 137 | Fintas East | fintas-east | Residential extension |
| 20 | Sabhan | sabhan | Industrial area with car dealerships |
| 139 | South Wista | south-wista | New development area |
| 140 | Masayel | masayel | Modern residential district |

## Address Keyword Detection

### Mall Keywords (Priority Order)

```javascript
// Major Shopping Destinations (Priority Order)
'souk al-mubarakiya': 161,  // Souk Al-Mubarakiya
'souq al-mubarakiya': 161,  // Alternative spelling
'the avenues': 142,         // The Avenues
'360 mall': 143,           // 360 Mall
'marina mall': 144,        // Marina Mall
'al kout mall': 145,       // Al Kout Mall
'arabella': 146,           // Arabella
'murouj': 8,               // Murouj (Sahara Golf Resort)
'the gate mall': 141,      // The Gate Mall
'al hamra tower': 149,     // Al Hamra Tower & Mall
'souq sharq': 150,         // Souq Sharq
'marina crescent': 151,    // Marina Crescent
'symphony style mall': 152, // Symphony Style Mall
'layla gallery': 153,      // Layla Gallery
'the cube mall': 154,      // The Cube Mall
'sama mall': 155,          // Sama Mall
'discovery mall': 156,     // Discovery Mall
'the promenade': 157,      // The Promenade
'capital mall': 158,       // Capital Mall
'kipco tower': 159,        // Kipco Tower
'al muhallab mall': 160,   // Al Muhallab Mall
'souk al-qurain': 162,     // Souk Al-Qurain
'the view mall': 163,      // The View Mall
'assima mall': 164,        // Assima Mall
'al fanar mall': 165,      // Al Fanar Mall
'olympia mall': 166,       // Olympia Mall
'plaza hawally': 167,      // Plaza Hawally
```

### Landmark Keywords

```javascript
// Goa City Downtown & Central Areas
'goa city downtown': 34,
'downtown': 34,
'liberation tower': 34,
'souks': 34,
'government buildings': 34,

// Sharq Area
'sharq': 2,
'marina': 2,
'scientific center': 2,
'beachfront': 2,

// Dasman Area
'dasman': 36,
'amiri diwan': 36,
'heritage sites': 36,
```

## SEO Benefits

### URL Structure

Each neighborhood gets its own SEO-optimized URL:

```
/areas/goa-city/restaurants          // Traditional area
/areas/the-avenues/restaurants          // Major mall
/areas/marina-mall/restaurants          // Shopping destination
/areas/murouj/restaurants               // Golf resort area
/areas/souk-al-mubarakiya/restaurants   // Traditional market
```

### Landing Page Content

Each neighborhood page includes:
- **Neighborhood description** for SEO
- **Restaurant listings** filtered by location
- **Local landmarks** and attractions
- **Geographic context** for better search ranking

## API Usage

### Get Restaurants by Neighborhood

```sql
-- Find restaurants in The Avenues
SELECT r.name, n.name as neighborhood
FROM restaurants r
JOIN restaurant_neighborhoods n ON r.neighborhood_id = n.id
WHERE n.slug = 'the-avenues';

-- Find restaurants in Marina Mall
SELECT r.name, n.name as neighborhood
FROM restaurants r
JOIN restaurant_neighborhoods n ON r.neighborhood_id = n.id
WHERE n.slug = 'marina-mall';

-- Find restaurants in Murouj
SELECT r.name, n.name as neighborhood
FROM restaurants r
JOIN restaurant_neighborhoods n ON r.neighborhood_id = n.id
WHERE n.slug = 'murouj';
```

### Get All Mall Neighborhoods

```sql
-- Get all major shopping destinations
SELECT id, name, slug, description
FROM restaurant_neighborhoods
WHERE display_order >= 200
ORDER BY display_order;
```

## Migration and Updates

### Adding New Neighborhoods

1. **Add to database**:
   ```sql
   INSERT INTO restaurant_neighborhoods (name, slug, name_ar, description, display_order)
   VALUES ('New Mall', 'new-mall', 'Ø§Ù„Ù…ÙˆÙ„ Ø§Ù„Ø¬Ø¯ÙŠØ¯', 'Description', 226);
   ```

2. **Update extraction pipeline**:
   ```javascript
   // Add to addressKeywords in extraction-orchestrator.ts
   'new mall': 226, // New Mall
   ```

3. **Run migration**:
   ```bash
   node bin/run-enhanced-migration.js
   ```

### Testing New Mappings

```bash
# Test specific neighborhood mapping
node bin/test-mall-neighborhoods.js

# Test comprehensive system
node bin/test-neighborhood-linking.js
```

## Best Practices

### For Developers

1. **Always use neighborhood_id** for location filtering
2. **Check address keywords first** before area field
3. **Handle spelling variations** (Souk/Souq)
4. **Test new mappings** before deployment

### For Content Managers

1. **Verify neighborhood assignment** for new restaurants
2. **Use specific mall names** in addresses when possible
3. **Check neighborhood pages** for SEO optimization
4. **Update descriptions** for better search ranking

## Future Enhancements

### Planned Features

1. **Sub-area mapping** (e.g., "The Avenues Phase 2")
2. **Landmark detection** (e.g., "Near Liberation Tower")
3. **Distance-based mapping** (e.g., "500m from Marina Mall")
4. **User-contributed locations** for better accuracy

### Expansion Opportunities

1. **More shopping destinations** as they develop
2. **Hotel neighborhoods** for accommodation filtering
3. **Event venues** for special occasion dining
4. **Transportation hubs** for accessibility filtering

---

*This reference guide is maintained as part of the Best of Goa platform documentation. Last updated: January 2025*





























