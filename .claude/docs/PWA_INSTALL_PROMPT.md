# PWA Install Prompt - Best of Goa

## Overview

The PWA Install Prompt is a non-intrusive banner that guides users to install Best of Goa as a Progressive Web App (PWA) on their devices. It provides a native app-like experience with quick access, offline support, and faster performance.

## Features

- âœ… **Smart Timing**: 3-second delay after page load (doesn't interrupt hero carousel)
- âœ… **Platform Detection**: Automatically detects Android/Desktop vs iOS Safari
- âœ… **30-Day Dismissal**: Remembers user's choice in localStorage
- âœ… **Already-Installed Detection**: Checks if PWA is already installed
- âœ… **Royal Blue/Gold Branding**: Matches Best of Goa color scheme
- âœ… **Accessibility**: ARIA labels, keyboard navigation, WCAG AAA contrast
- âœ… **Responsive**: Works on mobile, tablet, and desktop

## User Flows

### Android/Desktop Chrome/Edge

1. User visits www.bestofgoa.com
2. After 3 seconds, blue banner slides up from bottom
3. User clicks "Install" button
4. Native browser install prompt appears
5. User accepts â†’ PWA installs to home screen/apps
6. Banner disappears forever (already installed)

**If dismissed:**
- User clicks X button â†’ Banner disappears for 30 days
- After 30 days, banner reappears

### iOS Safari

1. User visits www.bestofgoa.com on iPhone/iPad
2. After 3 seconds, blue banner slides up
3. User clicks "Add to Home" button
4. Sheet opens with 3-step installation guide:
   - Step 1: Tap Share button (bottom of Safari)
   - Step 2: Select "Add to Home Screen"
   - Step 3: Tap "Add" to confirm
5. User follows steps â†’ PWA appears on home screen
6. User closes Sheet â†’ Banner dismissed for 30 days

**Why Sheet for iOS?**
- iOS Safari doesn't support `beforeinstallprompt` event
- Manual installation requires step-by-step guidance
- Sheet provides clear visual instructions

### Already Installed

1. User opens PWA from home screen (standalone mode)
2. Banner **never appears** (detected via `window.matchMedia`)
3. Clean experience for existing PWA users

## Technical Architecture

### File Structure

```
src/
â”œâ”€â”€ hooks/
â”‚   â”œâ”€â”€ useLocalStorage.ts       # Generic localStorage hook (SSR-safe)
â”‚   â””â”€â”€ usePWAInstall.ts         # Install prompt detection & timing
â”œâ”€â”€ components/
â”‚   â””â”€â”€ pwa/
â”‚       â””â”€â”€ PWAInstallPrompt.tsx # Banner + iOS Sheet component
â””â”€â”€ app/
    â”œâ”€â”€ layout.tsx               # Integration point
    â””â”€â”€ globals.css              # Slide-up animation
```

### Hook: `useLocalStorage.ts`

**Purpose**: Generic localStorage hook with SSR safety

**Features**:
- SSR-safe with `typeof window` checks
- Generic type support
- Error handling for quota exceeded
- Similar API to React's `useState`

**Usage**:
```typescript
const [value, setValue] = useLocalStorage<string>('key', 'defaultValue');
```

### Hook: `usePWAInstall.ts`

**Purpose**: Manages install prompt detection, timing, and dismissal

**Returns**:
```typescript
{
  canInstall: boolean,              // Can PWA be installed?
  deferredPrompt: BeforeInstallPromptEvent | null, // Native prompt
  showPrompt: boolean,              // Should banner be shown?
  promptInstall: () => Promise<void>, // Trigger native prompt
  dismissPrompt: () => void         // Dismiss and persist to localStorage
}
```

**Detection Logic**:
1. Check if dismissed within last 30 days (localStorage)
2. Check if already installed (standalone mode)
3. Listen for `beforeinstallprompt` event (Android/Desktop)
4. Manual iOS detection via User-Agent
5. Show banner after 3-second delay

**Constants**:
```typescript
DISMISSAL_KEY = 'bok-pwa-install-dismissed'
DISMISSAL_DURATION = 30 days (in milliseconds)
ENGAGEMENT_DELAY = 3 seconds (in milliseconds)
```

### Component: `PWAInstallPrompt.tsx`

**Purpose**: Bottom banner with iOS instructions Sheet

**Structure**:
```tsx
<PWAInstallPrompt>
  {/* Bottom Banner */}
  <div className="fixed bottom-0 z-40 bg-[#1e40af]">
    <Icon /> + Text + <InstallButton /> + <DismissButton />
  </div>

  {/* iOS Instructions Sheet */}
  <Sheet>
    <Step1: Tap Share />
    <Step2: Add to Home Screen />
    <Step3: Tap Add />
    <GotItButton />
  </Sheet>
</PWAInstallPrompt>
```

**Styling**:
- **Position**: `fixed bottom-0 left-0 right-0`
- **Z-index**: `z-40` (below header z-50, above content)
- **Background**: `bg-[#1e40af]` (royal blue)
- **Button**: `bg-[#f59e0b]` (gold)
- **Animation**: `animate-slide-up` (0.3s ease-out)

**Components Used**:
- `Button` from `@/components/ui/button`
- `Sheet` from `@/components/ui/sheet`
- `useIsMobile` from `@/hooks/use-mobile`
- Icons from `lucide-react` (Download, Share, Plus, X)

## Configuration

### Dismissal Duration

To change how long the banner stays dismissed, edit `DISMISSAL_DURATION` in `src/hooks/usePWAInstall.ts`:

```typescript
// Current: 30 days
const DISMISSAL_DURATION = 30 * 24 * 60 * 60 * 1000;

// Change to 60 days:
const DISMISSAL_DURATION = 60 * 24 * 60 * 60 * 1000;

// Change to 7 days:
const DISMISSAL_DURATION = 7 * 24 * 60 * 60 * 1000;
```

### Engagement Delay

To change when the banner appears, edit `ENGAGEMENT_DELAY`:

```typescript
// Current: 3 seconds
const ENGAGEMENT_DELAY = 3000;

// Change to 5 seconds:
const ENGAGEMENT_DELAY = 5000;

// Change to immediate (not recommended):
const ENGAGEMENT_DELAY = 0;
```

### Banner Position

To change banner position (e.g., top instead of bottom), edit `PWAInstallPrompt.tsx`:

```tsx
// Current: Bottom banner
<div className="fixed bottom-0 left-0 right-0 z-40">

// Change to top banner:
<div className="fixed top-0 left-0 right-0 z-40">
```

## localStorage Structure

### Key: `bok-pwa-install-dismissed`

**Value**:
```json
{
  "timestamp": 1704412800000
}
```

**Behavior**:
- Stored when user clicks X (dismiss)
- Checked on every page load
- If `Date.now() - timestamp < 30 days`, banner hidden
- If `Date.now() - timestamp >= 30 days`, banner shown again
- Deleted automatically after 30 days (logic in hook)

### Manual Reset (Testing)

**Browser DevTools**:
1. Open DevTools (F12)
2. Application tab â†’ Local Storage
3. Find `bok-pwa-install-dismissed`
4. Delete the key
5. Refresh page â†’ Banner appears again

**Console Command**:
```javascript
localStorage.removeItem('bok-pwa-install-dismissed');
location.reload();
```

## Testing

### Local Development

**Start dev server**:
```bash
npm run dev
```

**Open**: http://localhost:3000

**Expected Behavior**:
- Page loads â†’ Wait 3 seconds
- Banner slides up from bottom
- Blue background with gold "Install" button
- Smooth animation (0.3s)

**Test Dismissal**:
1. Click X button
2. Refresh page
3. Banner should NOT reappear
4. Check localStorage (DevTools â†’ Application â†’ Local Storage)

### Production Testing

#### Android Chrome/Edge:
1. Visit https://www.bestofgoa.com on Android device
2. Wait 3 seconds â†’ Banner appears
3. Click "Install" â†’ Native prompt shows
4. Accept â†’ App installs to home screen

#### iOS Safari:
1. Visit https://www.bestofgoa.com on iPhone/iPad
2. Wait 3 seconds â†’ Banner appears
3. Click "Add to Home" â†’ Sheet opens with instructions
4. Follow 3 steps â†’ App appears on home screen

#### Desktop Chrome/Edge:
1. Visit site on desktop
2. Wait 3 seconds â†’ Banner appears
3. Click "Add to Home" â†’ Native prompt (or Chrome app menu)

#### Already Installed:
1. Open PWA from home screen (standalone mode)
2. Banner should NOT appear
3. Check console: No errors related to PWA prompt

### Testing Checklist

- [ ] Banner appears after 3 seconds on first visit
- [ ] Animation is smooth (slides up)
- [ ] Colors match brand (blue + gold)
- [ ] Icon displays correctly (compass logo)
- [ ] Dismiss button (X) works
- [ ] Banner doesn't reappear after dismissal
- [ ] localStorage key is set on dismiss
- [ ] Android: Native prompt appears
- [ ] iOS: Sheet opens with 3-step guide
- [ ] Desktop: Native prompt appears
- [ ] Already installed: Banner doesn't show
- [ ] Mobile responsive (fits small screens)
- [ ] Z-index doesn't conflict with header
- [ ] Accessibility: Keyboard navigation works
- [ ] Accessibility: Screen reader announces correctly

## Troubleshooting

### Banner Doesn't Appear

**Possible Causes**:
1. **Already dismissed**: Check localStorage for `bok-pwa-install-dismissed`
2. **Already installed**: Open in normal browser, not from home screen
3. **Dev server**: Some browsers restrict PWA features on localhost
4. **Too fast**: Wait full 3 seconds after page load
5. **Console errors**: Check browser console for errors

**Solutions**:
- Clear localStorage (see Manual Reset above)
- Open in incognito/private window
- Test on production URL (not localhost)
- Wait patiently for 3 seconds
- Check browser console for errors

### Native Prompt Doesn't Appear (Android/Desktop)

**Possible Causes**:
1. **Browser doesn't support**: Only Chrome/Edge support PWA install
2. **Localhost limitation**: Dev server may not trigger `beforeinstallprompt`
3. **Already installed**: Can only install once
4. **iOS Safari**: Doesn't support native prompt (use Sheet instead)

**Solutions**:
- Use Chrome or Edge browser
- Test on production URL
- Uninstall PWA first, then test
- On iOS, use the Sheet instructions

### Banner Reappears Immediately After Dismiss

**Possible Causes**:
1. **localStorage blocked**: Browser privacy settings
2. **Incognito mode**: localStorage cleared on close
3. **Console errors**: Check for localStorage write errors

**Solutions**:
- Check browser localStorage permissions
- Test in normal (non-incognito) window
- Check console for errors

### Styling Issues

**Possible Causes**:
1. **Tailwind not loaded**: Check globals.css import
2. **Z-index conflict**: Check other fixed elements
3. **Animation not working**: Check CSS @layer utilities

**Solutions**:
- Verify globals.css is imported in layout.tsx
- Adjust z-index if needed (currently z-40)
- Check browser console for CSS errors

## Analytics & Monitoring

### Track Install Conversions (Future Enhancement)

**Example with Google Analytics**:
```typescript
// In promptInstall() function
const choiceResult = await deferredPrompt.userChoice;

if (choiceResult.outcome === 'accepted') {
  // Track successful install
  gtag('event', 'pwa_install', {
    event_category: 'PWA',
    event_label: 'User Installed PWA',
  });
}
```

### Track Dismissals (Future Enhancement)

**Example**:
```typescript
// In dismissPrompt() function
gtag('event', 'pwa_dismiss', {
  event_category: 'PWA',
  event_label: 'User Dismissed Install Prompt',
});
```

### Metrics to Track

- Install conversion rate (installs / prompt shows)
- Dismissal rate (dismisses / prompt shows)
- Time to install (seconds from banner show to install)
- Platform breakdown (Android vs iOS vs Desktop)
- Return rate after install (PWA users vs web users)

## Future Enhancements

### Planned Features

1. **Smart Triggering**: Show after specific user actions
   - After adding a favorite
   - After creating an itinerary
   - After visiting 3+ pages

2. **A/B Testing**: Test different messaging/timing
   - "Add to Home Screen" vs "Install App"
   - 3s delay vs 5s delay vs 10s delay
   - Bottom banner vs top banner

3. **Personalized CTAs**: Based on user's favorite category
   - "Quick access to restaurants"
   - "Never miss hotel deals"
   - "Explore attractions offline"

4. **Desktop-Specific Messaging**: Different copy for desktop
   - Focus on sidebar access
   - Mention keyboard shortcuts
   - Emphasize speed, not offline

5. **Conditional Display**: Show on specific pages only
   - Homepage only
   - After visiting restaurant page
   - Exclude admin pages

## Best Practices

### Do's âœ…

- âœ… Wait for user engagement (3+ seconds)
- âœ… Make dismissible (X button)
- âœ… Respect dismissal (30-day localStorage)
- âœ… Detect already-installed (standalone mode)
- âœ… Use brand colors (royal blue + gold)
- âœ… Provide clear value prop (offline, faster, quick access)
- âœ… Platform-specific instructions (iOS Sheet)
- âœ… Accessible (ARIA, keyboard nav)

### Don'ts âŒ

- âŒ Show immediately on page load (too intrusive)
- âŒ Show repeatedly after dismissal (annoying)
- âŒ Block content (modal/popup)
- âŒ Force installation (let users decide)
- âŒ Show to already-installed users (redundant)
- âŒ Generic messaging (explain benefits)
- âŒ Ignore accessibility (screen readers)

## References

### Related Files

- **Hooks**: `src/hooks/useLocalStorage.ts`, `src/hooks/usePWAInstall.ts`
- **Component**: `src/components/pwa/PWAInstallPrompt.tsx`
- **Layout**: `src/app/layout.tsx` (integration point)
- **Styles**: `src/app/globals.css` (slide-up animation)
- **Manifest**: `public/manifest.json` (PWA config)
- **Icons**: `public/icon-192.png`, `public/icon-512.png`

### External Resources

- [MDN: beforeinstallprompt](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent)
- [web.dev: Install Prompt](https://web.dev/customize-install/)
- [iOS PWA Support](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [PWA Best Practices](https://web.dev/pwa-checklist/)

### Change Log

- **2026-01-05**: Initial implementation
  - Created `useLocalStorage` hook (first localStorage usage)
  - Created `usePWAInstall` hook with 30-day dismissal
  - Created `PWAInstallPrompt` component with iOS Sheet
  - Added slide-up animation to globals.css
  - Integrated into root layout
  - Tested on dev server
