# Apify Billing Dispute Case
**Date Filed:** November 13, 2025
**Project:** Best of Goa Directory
**Issue:** Overcharge due to maxCrawledPlaces parameter not being respected

---

## EXECUTIVE SUMMARY

**Overcharge Amount:** $0.092
**Expected Charge:** $0.011
**Actual Charge:** $0.103
**Overcharge Percentage:** 836%

The Apify actor `compass/crawler-google-places` was configured with `maxCrawledPlaces: 1` but scraped 24 places instead, resulting in being charged for 23 excess places at $0.004 per place.

---

## 1. WHEN THE OVERCHARGING OCCURRED

| Detail | Value |
|--------|-------|
| **Date** | November 12, 2025 |
| **Time (UTC)** | 20:13:41 |
| **Run ID** | `ngUkI0fVu3TxJNf4V` |
| **Actor** | `compass/crawler-google-places` |
| **Build ID** | `XQR8ivOmlHxRePX0o` |
| **Status** | SUCCEEDED |
| **Duration** | ~8 seconds |
| **Dataset ID** | `GwB4cFTr2NwjczV7u` |

**Timestamp Details:**
- Started: `2025-11-12T20:13:41.070Z`
- Finished: `2025-11-12T20:13:48.960Z`

---

## 2. YOUR RUN DETAILS - INPUT PARAMETERS

### Configuration Provided

```json
{
  "searchStringsArray": [
    "Versus Versace Caffe Goa"
  ],
  "maxCrawledPlaces": 1,
  "maxReviews": 0,
  "maxImages": 0,
  "includeOpeningHours": true,
  "language": "en"
}
```

### Critical Parameter

**`maxCrawledPlaces: 1`**

**Expected Behavior (per Apify documentation):**
The actor should stop after extracting details for **1 place**, regardless of how many search results are found.

**Source Code Evidence:**

From `src/lib/services/apify-client.ts` (line 176-183):

```typescript
const input = {
  searchStringsArray: [specificQuery],
  maxCrawledPlaces: 1,  // â† EXPLICITLY SET TO 1
  maxReviews: 0,
  maxImages: 0,
  includeOpeningHours: true,
  language: 'en'
};
```

---

## 3. ACTUAL RESULTS - WHAT WAS SCRAPED

**Total Places Scraped:** 24 (should have been 1)

### Places Charged For:

1. **Ves Vas** (Coffee shop) - Sheikh Jaber Al-Ahmad Cultural Centre
2. **VERO cafe & Restaurant** (Cafe) - Salem Mobarak, Salmyia
3. **Ciervo Cafe (Sharq)** (Cafe) - Ahmad Al Jaber St, Goa City
4. **VIBES Coffee** (Coffee shop) - Mangaf
5. **Lavazza (Assima Mall)** (Coffee shop) - Goa City
6. **Caffe Nero** (Coffee shop) - Goa City
7. **Starbucks** - Multiple locations
8. **Costa Coffee** - Multiple locations
9. *...and 16 more places*

**Database Verification:**

Only **1 place** was stored in our database:
- Restaurant ID: `2d87fd8e-c75d-4932-9c0a-ac7ff4e59c00`
- Name: `Versus Versace Caffe`
- Google Place ID: `ChIJsxyySyCFzz8Rprr0aNnu11g`
- Created: `2025-11-12T20:13:39.946023`

This confirms that our application **only needed and used 1 result**, but Apify charged for 24.

---

## 4. SPECIFIC CHARGES BELIEVED TO BE INCORRECT

### Pay-Per-Event Pricing Breakdown

**Apify's Published Rates:**
- Actor start: $0.007 per run
- Place scraped: $0.004 per place

### Expected Charges (with maxCrawledPlaces=1):

| Item | Calculation | Amount |
|------|-------------|--------|
| Actor start | 1 Ã— $0.007 | $0.007 |
| Places scraped | 1 Ã— $0.004 | $0.004 |
| **TOTAL EXPECTED** | | **$0.011** |

### Actual Charges:

| Item | Calculation | Amount |
|------|-------------|--------|
| Actor start | 1 Ã— $0.007 | $0.007 |
| Places scraped | 24 Ã— $0.004 | $0.096 |
| **TOTAL ACTUAL** | | **$0.103** |

### Overcharge Calculation:

| Metric | Value |
|--------|-------|
| **Incorrect Charge** | $0.103 |
| **Correct Charge** | $0.011 |
| **OVERCHARGE** | **$0.092** |
| **Excess Places Charged** | 23 places |
| **Excess Places Cost** | 23 Ã— $0.004 = $0.092 |

---

## 5. EVIDENCE OF BUG / PARAMETER FAILURE

### A. Input Parameter Was Correctly Set

**Evidence:** API input configuration shows `maxCrawledPlaces: 1` was provided.

### B. Actor Ignored the Parameter

**Evidence:** Dataset contains 24 places instead of 1.

### C. Other Runs in Same Batch Worked Correctly

**Comparison Table:**

| Run ID (partial) | Restaurant | Search Query | maxCrawledPlaces | Actual Scraped | Status |
|------------------|------------|--------------|------------------|----------------|--------|
| `ucZj9ysfx...` | Sala Thai Restaurant | "Sala Thai Restaurant Goa" | 1 | **1** âœ… | Correct |
| `OnINoL8W...` | Review CafÃ© | "Review CafÃ© Goa" | 1 | **1** âœ… | Correct |
| **`ngUkI0fVu...`** | **Versus Versace Caffe** | **"Versus Versace Caffe Goa"** | **1** | **24** âŒ | **BUG** |
| `u4n8u8Q8W...` | Dogmatic | "Dogmatic Goa" | 1 | **1** âœ… | Correct |

**All runs:**
- Executed within the same 10-minute window
- Used identical actor build (`XQR8ivOmlHxRePX0o`)
- Had identical parameter configuration
- Were part of the same automated batch extraction

**Conclusion:**
The parameter works correctly in 3 out of 4 cases, proving that the failure is a bug specific to this run, not a misunderstanding of the parameter's function.

---

## 6. APIFY LOG EVIDENCE

From the Apify run log (provided by Douglas):

```
2025-11-12T20:13:48.536Z INFO  ðŸ“Š 24 places scraped | unique: 24 | duplicate: 17 | seen: 41 | searchPages: 1 | paginations: 4
```

**Key Details:**
- **24 unique places found**
- **4 pagination pages scrolled**
- Search completed successfully
- Actor reported "24 places scraped"

**Analysis:**
The actor correctly identified that it found 24 places during the search phase but **failed to respect the `maxCrawledPlaces: 1` limit** during the extraction phase.

---

## 7. IMPACT & COST IMPLICATIONS

### This Single Run:
- **Overcharge:** $0.092

### If This Bug Occurs in Our TripAdvisor Batch (115 restaurants):
- **Expected Cost:** 115 Ã— $0.011 = $1.27
- **If All Return 24 Results:** 115 Ã— $0.103 = $11.85
- **Potential Overcharge:** $10.58
- **Overcharge Percentage:** 831%

### Financial Impact:
This bug creates **unpredictable and uncontrollable costs** that are 8-9x higher than expected, making it impossible to budget accurately for large-scale extraction projects.

---

## 8. REQUESTED RESOLUTION

### Primary Request:
**Refund of $0.092** for the 23 excess places scraped beyond the configured `maxCrawledPlaces: 1` limit.

### Secondary Requests:
1. **Bug Investigation:** Investigate why `maxCrawledPlaces` was ignored for this specific run
2. **Bug Fix:** Implement a fix to ensure the parameter is always respected
3. **Confirmation:** Provide assurance that future runs will honor the `maxCrawledPlaces` parameter
4. **Documentation:** Clarify in documentation if certain search queries can override this parameter

---

## 9. CONTACT INFORMATION

**Account Email:** [Your Apify Account Email]
**Project:** Best of Goa Directory
**Technical Contact:** Douglas

---

## 10. SUPPORTING DOCUMENTATION

### A. Code Repository Evidence

**File:** `src/lib/services/apify-client.ts`
**Function:** `extractPlaceDetails()`
**Lines:** 176-183

The configuration is programmatically generated and consistently sets `maxCrawledPlaces: 1` for all single-restaurant extractions.

### B. Database Evidence

Query: `SELECT * FROM restaurants WHERE google_place_id = 'ChIJsxyySyCFzz8Rprr0aNnu11g'`

Result shows only 1 restaurant record created, confirming we only needed 1 result.

### C. Run Comparison Data

All 4 runs from the same batch can be audited:
- `ucZj9ysfxw8QSdYLn` (Sala Thai) - âœ… Correct
- `OnINoL8W5NUgpbFcG` (Review CafÃ©) - âœ… Correct
- `ngUkI0fVu3TxJNf4V` (Versus Versace) - âŒ Bug
- `u4n8u8Q8WNNwlWExs` (Dogmatic) - âœ… Correct

---

## CONCLUSION

The evidence clearly demonstrates that:

1. âœ… The `maxCrawledPlaces` parameter was correctly set to 1
2. âœ… The actor ignored this parameter and scraped 24 places
3. âœ… This behavior was inconsistent with other runs in the same batch
4. âœ… We were charged for 23 excess places ($0.092 overcharge)
5. âœ… This represents a bug in the actor, not a configuration error

**We respectfully request a refund of $0.092 and investigation into this parameter failure.**

---

**Generated:** November 13, 2025
**Case Number:** [To be assigned by Apify Support]
**Run ID:** `ngUkI0fVu3TxJNf4V`
