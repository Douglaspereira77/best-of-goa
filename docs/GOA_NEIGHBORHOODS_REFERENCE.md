# Goa Neighborhoods & Areas Reference

This document outlines the geographical structure for Best of Goa, mapping districts, talukas, and major towns/beaches.

## Structure

Goa is divided into two primary districts:
1. **North Goa**
2. **South Goa**

### North Goa
Key areas (Coastal & Inland):
- **Panjim (Panaji)** - Capital City
- **Candolim**
- **Calangute**
- **Baga**
- **Anjuna**
- **Vagator**
- **Siolim**
- **Morjim**
- **Ashwem**
- **Mandrem**
- **Arambol**
- **Mapusa**
- **Porvorim**
- **Old Goa**
- **Miramar**
- **Dona Paula**

### South Goa
Key areas:
- **Margao (Madgaon)** - Commercial Capital
- **Vasco da Gama**
- **Colva**
- **Benaulim**
- **Varca**
- **Cavelossim**
- **Mobor**
- **Agonda**
- **Palolem**
- **Patnem**
- **Majorda**
- **Utorda**
- **Bogmalo**

## Database Mapping

When extracting data from Google Maps or other sources, we map address components to these slugs.

| Extracted Name | Slug | District |
|DIFFERENT_NAMES|---|---|
| Panaji, Panjim | panjim | North Goa |
| Madgaon, Margao | margao | South Goa |
| Vasco, Vasco da Gama | vasco | South Goa |
| Calangute | calangute | North Goa |
| ... | ... | ... |

## Slug Generation Rules

1. Remove "Goa", "India", postal codes.
2. Identify major area from list above.
3. If no specific area found, fallback to "North Goa" or "South Goa" if detectable, else "Goa".
