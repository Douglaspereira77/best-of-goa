#!/usr/bin/env npx tsx
import { config } from 'dotenv';
config({ path: '.env.local' });

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY!;

async function main() {
  console.log('=== BEST WESTERN PLUS SALMIYA - IMAGE EXTRACTION ===\n');

  const { data: hotel } = await supabase
    .from('hotels')
    .select('*')
    .ilike('name', '%best western%salmiya%')
    .single();

  if (!hotel) {
    console.error('Hotel not found');
    process.exit(1);
  }

  console.log('Hotel:', hotel.name);
  console.log('Slug:', hotel.slug);
  console.log('Place ID:', hotel.google_place_id);

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${hotel.google_place_id}&fields=photos&key=${googlePlacesApiKey}`;
  const response = await axios.get(url);
  const photos = response.data.result.photos || [];

  console.log('\nTotal Google Places photos:', photos.length);

  const MIN_WIDTH = 1200, MIN_HEIGHT = 900, MIN_IMAGES = 6;

  const allProcessed = photos.map((photo: any) => {
    const width = photo.width || 1920;
    const height = photo.height || 1080;
    return {
      url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${width}&photoreference=${photo.photo_reference}&key=${googlePlacesApiKey}`,
      width, height,
      totalPixels: width * height,
      quality_tier: (width >= MIN_WIDTH && height >= MIN_HEIGHT) ? 'premium' : 'best_available'
    };
  }).sort((a: any, b: any) => b.totalPixels - a.totalPixels);

  const premium = allProcessed.filter((p: any) => p.quality_tier === 'premium');
  const bestAvail = allProcessed.filter((p: any) => p.quality_tier === 'best_available');

  let selectedPhotos: any[];
  if (premium.length >= MIN_IMAGES) {
    selectedPhotos = premium.slice(0, 10);
    console.log(`\n✅ Using ${selectedPhotos.length} PREMIUM photos`);
  } else {
    const needed = MIN_IMAGES - premium.length;
    selectedPhotos = [...premium, ...bestAvail.slice(0, needed)];
    console.log(`\n🔄 HYBRID: ${premium.length} premium + ${needed} best_available = ${selectedPhotos.length} total`);
  }

  selectedPhotos.forEach((p, i) => {
    const mark = p.quality_tier === 'premium' ? '✅' : '⚪';
    console.log(`${i + 1}. ${mark} ${p.width}×${p.height}`);
  });

  console.log('\n--- Processing with Vision API ---\n');

  const processedImages: any[] = [];

  for (let i = 0; i < selectedPhotos.length; i++) {
    const img = selectedPhotos[i];
    console.log(`Processing ${i + 1}/${selectedPhotos.length}...`);

    try {
      const imageResponse = await axios.get(img.url, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(imageResponse.data);
      const base64Image = imageBuffer.toString('base64');

      const visionResponse = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: `Analyze this hotel image. JSON: {"alt": "description at ${hotel.name}", "descriptor": "3-5 word filename", "heroScore": 0-100}` },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
          ]
        }]
      });

      const textContent = visionResponse.choices[0]?.message?.content || '{}';
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      const analysis = JSON.parse(jsonMatch ? jsonMatch[0] : textContent);

      const descriptor = analysis.descriptor?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `image-${i + 1}`;
      const filename = `${hotel.slug}-${descriptor}.jpg`;
      const path = `${hotel.slug}/images/${filename}`;

      await supabase.storage.from('hotels').upload(path, imageBuffer, { contentType: 'image/jpeg', upsert: true });
      const { data: publicUrlData } = supabase.storage.from('hotels').getPublicUrl(path);

      processedImages.push({
        url: publicUrlData.publicUrl,
        alt_text: analysis.alt,
        hero_score: analysis.heroScore || 50,
        type: 'gallery',
        is_hero: false,
        display_order: i + 1
      });

      console.log(`  ✅ ${analysis.alt?.substring(0, 60)}... (Score: ${analysis.heroScore})`);
    } catch (error: any) {
      console.error(`  ❌ Failed:`, error.message);
    }
  }

  const heroImage = processedImages.reduce((best, curr) => curr.hero_score > best.hero_score ? curr : best, processedImages[0]);
  heroImage.type = 'hero';
  heroImage.is_hero = true;
  heroImage.display_order = 0;

  await supabase.from('hotel_images').delete().eq('hotel_id', hotel.id);
  const records = processedImages.map(img => ({ hotel_id: hotel.id, ...img, approved: true }));
  await supabase.from('hotel_images').insert(records);
  await supabase.from('hotels').update({ hero_image: heroImage.url }).eq('id', hotel.id);

  console.log(`\n=== RESULTS ===`);
  console.log(`Total: ${processedImages.length} images`);
  console.log(`Hero: ${heroImage.alt_text}`);
  console.log(`\n✅ Database updated! View at: http://localhost:3000/places-to-stay/hotels/${hotel.slug}`);
}

main().catch(console.error);
