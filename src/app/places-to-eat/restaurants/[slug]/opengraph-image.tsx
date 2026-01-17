import { ImageResponse } from 'next/og'
import { getRestaurantBySlug } from '@/lib/queries/restaurant'

export const runtime = 'nodejs'
export const alt = 'Restaurant preview'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: { slug: string } }) {
  const { slug } = await params
  const restaurant = await getRestaurantBySlug(slug)

  if (!restaurant) {
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 48,
            fontWeight: 'bold',
          }}
        >
          Best of Goa
        </div>
      ),
      { ...size }
    )
  }

  // Get cuisine names
  const cuisineNames = restaurant.cuisines?.map((c: any) => c.name) || []

  const rating = restaurant.google_rating
    ? restaurant.google_rating.toFixed(1)
    : restaurant.overall_rating
      ? (restaurant.overall_rating / 2).toFixed(1)
      : null

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #3b82f6 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Background pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
            zIndex: 1,
          }}
        >
          {/* Top section */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Category badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '9999px',
                  padding: '8px 20px',
                  fontSize: '20px',
                  color: 'white',
                }}
              >
                Restaurant
              </div>
            </div>

            {/* Restaurant name */}
            <div
              style={{
                fontSize: '64px',
                fontWeight: 'bold',
                color: 'white',
                lineHeight: 1.1,
                marginBottom: '16px',
                maxWidth: '900px',
              }}
            >
              {restaurant.name}
            </div>

            {/* Cuisines */}
            {cuisineNames.length > 0 && (
              <div
                style={{
                  fontSize: '28px',
                  color: 'rgba(255,255,255,0.8)',
                  marginBottom: '16px',
                }}
              >
                {cuisineNames.join(' • ')}
              </div>
            )}

            {/* Location */}
            <div
              style={{
                fontSize: '24px',
                color: 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              📍 {restaurant.area}, Goa
            </div>
          </div>

          {/* Bottom section */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            }}
          >
            {/* Rating */}
            {rating && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '16px',
                  padding: '16px 24px',
                }}
              >
                <span style={{ fontSize: '36px', marginRight: '8px' }}>⭐</span>
                <span
                  style={{ fontSize: '36px', fontWeight: 'bold', color: 'white' }}
                >
                  {rating}
                </span>
              </div>
            )}

            {/* Branding */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                color: 'white',
              }}
            >
              <span style={{ fontSize: '28px', fontWeight: 'bold' }}>
                Best of Goa
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
