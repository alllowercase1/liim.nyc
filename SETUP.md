# Liim Lasalle Website Setup

## Quick Start

The site is ready to deploy! Just add your asset files as described below.

## Required Assets

Add these files to complete the site:

### 1. Logo (REQUIRED)
- **Source:** `Gemini_Generated_Image_g9j7wkg9j7wkg9j7.png`
- **Destination:** `assets/images/logo.png`
- The elegant script "Liim Lasalle" logo (transparent PNG)

### 2. Hero/Bio Image (REQUIRED)
- **Source:** `IMG_2697.jpeg`
- **Destination:** `assets/images/hero.jpg`
- B&W performance shot, used as video poster and bio image

### 3. Background Video (REQUIRED for homepage)
- **Source:** Your hero loop video
- **Destination:** `assets/video/hero-loop.mp4`
- Should be a looping, cinematic video (will play muted, autoplaying)

### 4. Favicon (OPTIONAL - already has SVG fallback)
- **Destination:** `favicon.ico`
- 32x32 or 16x16 icon file
- The site already has `favicon.svg` as a fallback

### 5. Social/OG Image (RECOMMENDED)
- **Destination:** `assets/images/og-image.jpg`
- 1200x630 image for social media sharing

## Merch Images

Replace the placeholder merch cards with actual product photos:

| Item | Destination |
|------|-------------|
| LLLY Tee | `assets/images/merch/tee.jpg` |
| LLLY Hoodie | `assets/images/merch/hoodie.jpg` |
| LLLY Vinyl | `assets/images/merch/vinyl.jpg` |
| LL Dad Hat | `assets/images/merch/hat.jpg` |

Then update `merch.html` to reference these images.

## Square Payment Integration

When ready to sell merch:

1. Get checkout links from Square Dashboard
2. Replace `href="#"` on BUY buttons with `href="https://square.link/u/XXXXXX"`

## Bandsintown Integration

To add Bandsintown widget:

1. Go to https://artists.bandsintown.com
2. Get your embed widget code
3. Replace the placeholder in `shows.html`

## Adding News Articles

Edit `data/news.json` to add new press coverage:

```json
{
  "id": 3,
  "headline": "Article Title",
  "source": "Publication Name",
  "date": "Month Year",
  "thumbnail": "https://example.com/image.jpg",
  "url": "https://example.com/article",
  "excerpt": "Brief description"
}
```

## Adding Videos

Edit `videos.html` to add more video cards. Copy an existing `video-card` article and update:
- YouTube video ID in thumbnail URL
- YouTube video ID in link
- Video title

YouTube thumbnail format: `https://img.youtube.com/vi/VIDEO_ID/hqdefault.jpg`

## Deployment

This is a static site - deploy to:
- **GitHub Pages** (free, recommended)
- **Netlify**
- **Vercel**
- Any static hosting

### GitHub Pages Deployment:

1. Create a new repository on GitHub
2. Push this folder to the repo
3. Go to Settings → Pages
4. Select "Deploy from a branch" → main → / (root)
5. Set up custom domain `liim.nyc` in Pages settings
6. Add CNAME record pointing to `yourusername.github.io`

## File Structure

```
/
├── index.html          # Homepage
├── shows.html          # Tour dates
├── merch.html          # Merchandise
├── videos.html         # Video gallery
├── news.html           # Press coverage
├── css/
│   └── styles.css      # All styles (Y2K aesthetic)
├── js/
│   └── main.js         # Navigation, news loading
├── assets/
│   ├── images/
│   │   ├── logo.png    # ADD THIS
│   │   ├── hero.jpg    # ADD THIS
│   │   └── merch/      # Product photos
│   ├── video/
│   │   └── hero-loop.mp4  # ADD THIS
│   └── cursors/
│       └── *.svg       # Retro cursor graphics
├── data/
│   └── news.json       # News data (edit to add articles)
├── favicon.svg         # Browser tab icon
└── SETUP.md            # This file
```

## Support

Questions? Reach out to the developer who built this site.
