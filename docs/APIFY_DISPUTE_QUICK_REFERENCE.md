# Apify Billing Dispute - Quick Reference

**For submitting to Apify Support**

---

## COPY-PASTE SUMMARY FOR SUPPORT TICKET

```
Subject: Billing Dispute - Run ID ngUkI0fVu3TxJNf4V - Overcharge $0.092

Dear Apify Support,

I am disputing a billing charge for Run ID: ngUkI0fVu3TxJNf4V

THE ISSUE:
My run was configured with maxCrawledPlaces: 1 but the actor scraped 24 places
instead of stopping after 1, resulting in an overcharge of $0.092.

KEY FACTS:
- Actor: compass/crawler-google-places
- Run ID: ngUkI0fVu3TxJNf4V
- Date: November 12, 2025 at 20:13:41 UTC
- Input parameter: maxCrawledPlaces: 1 (verified in run input)
- Expected charge: $0.011 (1 place)
- Actual charge: $0.103 (24 places)
- Overcharge: $0.092 (23 excess places × $0.004)

EVIDENCE:
1. The run's INPUT configuration shows maxCrawledPlaces: 1
2. The run's DATASET contains 24 places instead of 1
3. Three other runs in the same batch with identical parameters worked correctly:
   - ucZj9ysfxw8QSdYLn: scraped 1 place ✓
   - OnINoL8W5NUgpbFcG: scraped 1 place ✓
   - u4n8u8Q8WNNwlWExs: scraped 1 place ✓
   - ngUkI0fVu3TxJNf4V: scraped 24 places ✗ (THIS RUN)

This demonstrates the parameter works correctly but failed for this specific run.

REQUESTED RESOLUTION:
Refund of $0.092 for 23 excess places scraped beyond the configured limit.

FULL DOCUMENTATION:
I have compiled detailed evidence including run logs, input configuration,
dataset results, and comparison with other runs. Happy to provide additional
information if needed.

Run Details:
- Run ID: ngUkI0fVu3TxJNf4V
- Build ID: XQR8ivOmlHxRePX0o
- Dataset ID: GwB4cFTr2NwjczV7u
- Started: 2025-11-12T20:13:41.070Z
- Finished: 2025-11-12T20:13:48.960Z

Thank you for investigating this issue.

[Your Name]
[Your Apify Account Email]
```

---

## QUICK FACTS

| Item | Value |
|------|-------|
| **Overcharge** | $0.092 |
| **Run ID** | ngUkI0fVu3TxJNf4V |
| **Date** | November 12, 2025 |
| **Actor** | compass/crawler-google-places |
| **Expected Places** | 1 |
| **Actual Places** | 24 |
| **Excess Places** | 23 |

---

## HOW TO SUBMIT

### Option 1: Apify Support Portal
1. Go to: https://apify.com/contact
2. Select "Billing Issue"
3. Copy-paste the summary above
4. Attach: `docs/APIFY_BILLING_DISPUTE_CASE.md`

### Option 2: Email
1. Email: support@apify.com
2. Subject: "Billing Dispute - Run ID ngUkI0fVu3TxJNf4V"
3. Copy-paste the summary above
4. Attach: `docs/APIFY_BILLING_DISPUTE_CASE.md`

### Option 3: In-App Chat
1. Log into Apify Console
2. Click support chat icon
3. Copy-paste the summary above
4. Reference Run ID: ngUkI0fVu3TxJNf4V

---

## SUPPORTING FILES

All evidence is compiled in:
- **Full Case:** `docs/APIFY_BILLING_DISPUTE_CASE.md`
- **Run Analysis:** Run `node bin/build-apify-dispute-case.js` for latest data
- **Cost Verification:** Run `node bin/check-apify-run-cost.js` anytime

---

## EXPECTED RESPONSE TIME

Typical Apify support response: 24-48 hours
Billing disputes may take: 3-5 business days

---

## IF THEY ASK FOR MORE INFO

**They might request:**

1. **Account Email** - Your Apify login email
2. **Organization Name** - If you're on a team plan
3. **Payment Method** - Last 4 digits of card (for verification)
4. **Run URL** - https://console.apify.com/actors/compass~crawler-google-places/runs/ngUkI0fVu3TxJNf4V

**You can provide:**

- Full input configuration (in dispute case document)
- Dataset contents (24 places list in dispute case)
- Comparison with other successful runs
- Code evidence showing parameter was set correctly
- Database evidence showing only 1 place was needed

---

## PREVENTION FOR FUTURE RUNS

To avoid this issue until it's fixed:

1. **Use More Specific Search Queries**
   - Include full address in search
   - Use unique identifiers (building names, landmarks)

2. **Monitor Runs Actively**
   - Check dataset size immediately after run completes
   - Run `node bin/check-apify-run-cost.js` after each batch

3. **Set Budget Limits**
   - Use Apify's max cost parameter in runs
   - Set billing alerts in Apify account

4. **Consider Alternative Actors**
   - Test other Google Maps scrapers
   - Use Google Places API directly (if cost-effective)

---

**Last Updated:** November 13, 2025
