/**
 * AI Sentiment Analyzer for Restaurant Reviews
 * Uses OpenAI to analyze review sentiment and generate component modifiers
 */

import { openAIClient } from './openai-client';
import { SentimentModifiers } from './rating-types';

export class SentimentAnalyzer {
    /**
     * Analyze reviews and generate sentiment modifiers for each component
     */
    async analyzeSentiment(reviews: any[]): Promise<SentimentModifiers> {
        if (!reviews || reviews.length === 0) {
            return this.getDefaultModifiers();
        }

        // Extract review texts
        const reviewTexts = reviews
            .filter((r) => r.text && r.text.trim().length > 0)
            .map((r) => r.text)
            .slice(0, 20); // Analyze up to 20 reviews

        if (reviewTexts.length === 0) {
            return this.getDefaultModifiers();
        }

        try {
            const prompt = this.buildSentimentPrompt(reviewTexts);
            const response = await openAIClient.chat(prompt, 'gpt-4o-mini');

            // Strip markdown code blocks if present
            let jsonContent = response.trim();
            if (jsonContent.startsWith('```')) {
                jsonContent = jsonContent.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
            }

            const result = JSON.parse(jsonContent);
            return this.validateModifiers(result);
        } catch (error) {
            console.error('[SentimentAnalyzer] Failed to analyze sentiment:', error);
            return this.getDefaultModifiers();
        }
    }

    /**
     * Build the OpenAI prompt for sentiment analysis
     */
    private buildSentimentPrompt(reviewTexts: string[]): string {
        return `Analyze these restaurant reviews and provide sentiment modifiers for each rating category.

Reviews:
${reviewTexts.map((text, i) => `${i + 1}. ${text}`).join('\n\n')}

Apply these keyword impact rules for EACH review:
- Critical negative keywords (dirty, food poisoning, rude, worst, terrible, awful): -0.8 per occurrence
- Moderate negative keywords (slow service, overpriced, disappointing, mediocre): -0.4 per occurrence
- Minor negative keywords (average, nothing special, okay): -0.2 per occurrence
- Positive keywords (excellent, amazing, highly recommend, delicious, outstanding, perfect): +0.3 per occurrence

Categorize keywords by component:
- Food Quality: Keywords about taste, flavor, ingredients, dishes, menu, cooking
- Service: Keywords about staff, waiters, service speed, attentiveness, friendliness
- Ambience: Keywords about atmosphere, decor, music, vibe, setting, cleanliness
- Value for Money: Keywords about prices, portions, worth it, expensive, cheap
- Accessibility: Keywords about parking, wheelchair access, facilities, location

Sum up the modifiers for each component across all reviews, then cap each modifier between -3.0 and +3.0.

Return ONLY valid JSON in this exact format:
{
  "foodQualityModifier": <number between -3.0 and +3.0>,
  "serviceModifier": <number between -3.0 and +3.0>,
  "ambienceModifier": <number between -3.0 and +3.0>,
  "valueModifier": <number between -3.0 and +3.0>,
  "accessibilityModifier": <number between -3.0 and +3.0>,
  "keywordCounts": {
    "criticalNegative": [<array of keywords found>],
    "moderateNegative": [<array of keywords found>],
    "minorNegative": [<array of keywords found>],
    "positive": [<array of keywords found>]
  }
}`;
    }

    /**
     * Validate and sanitize modifiers
     */
    private validateModifiers(result: any): SentimentModifiers {
        const clamp = (val: number, min: number, max: number) =>
            Math.min(Math.max(val, min), max);

        return {
            foodQualityModifier: clamp(result.foodQualityModifier || 0, -3.0, 3.0),
            serviceModifier: clamp(result.serviceModifier || 0, -3.0, 3.0),
            ambienceModifier: clamp(result.ambienceModifier || 0, -3.0, 3.0),
            valueModifier: clamp(result.valueModifier || 0, -3.0, 3.0),
            accessibilityModifier: clamp(result.accessibilityModifier || 0, -3.0, 3.0),
            keywordCounts: result.keywordCounts || {
                criticalNegative: [],
                moderateNegative: [],
                minorNegative: [],
                positive: [],
            },
        };
    }

    /**
     * Default modifiers when no reviews or analysis fails
     */
    private getDefaultModifiers(): SentimentModifiers {
        return {
            foodQualityModifier: 0,
            serviceModifier: 0,
            ambienceModifier: 0,
            valueModifier: 0,
            accessibilityModifier: 0,
            keywordCounts: {
                criticalNegative: [],
                moderateNegative: [],
                minorNegative: [],
                positive: [],
            },
        };
    }
}

// Export singleton instance
export const sentimentAnalyzer = new SentimentAnalyzer();
