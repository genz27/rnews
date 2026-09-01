# RSS NEWS 📰

A beautiful, mobile-first RSS news aggregator with Xiaohongshu (小红书) style infinite-scroll card feed. Aggregates multiple RSS feeds into a continuous waterfall/masonry layout.

![RSS News](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8)

## Features ✨

- **Infinite Scroll**: Seamless infinite scrolling with automatic loading
- **Masonry Layout**: Responsive waterfall grid (2 cols mobile, 3-4 desktop)
- **Category Filtering**: Filter by content categories with smooth chip navigation
- **Search**: Real-time client-side search by title and source
- **Dark Mode**: Beautiful light/dark theme with system preference detection
- **Mobile-First**: Optimized for mobile with smooth touch interactions
- **Smart Caching**: Aggressive 30-minute server-side caching to minimize feed requests
- **Multi-Source**: Aggregates 100+ RSS feeds from tech, AI, design, security, and VPS/hosting

## Tech Stack 🛠️

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **RSS Parsing**: rss-parser + xml2js
- **UI Libraries**: react-masonry-css, react-intersection-observer
- **Date Handling**: date-fns with i18n support

## Getting Started 🚀

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Local Development

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd <your-repo-name>
```

2. **Install dependencies**

```bash
npm install
```

3. **Run development server**

```bash
npm run dev
```

4. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## Deploy to Vercel 🚢

This project is optimized for Vercel deployment.

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<your-repo-url>)

### Option 2: Manual Deploy

1. **Install Vercel CLI**

```bash
npm i -g vercel
```

2. **Deploy**

```bash
vercel
```

3. **Follow the prompts** to link/create your project

### Option 3: Git Integration

1. Push your code to GitHub/GitLab/Bitbucket
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Vercel will auto-detect Next.js and deploy

## Configuration ⚙️

### Environment Variables (Optional)

Create `.env.local` for custom configuration:

```env
# Custom OPML URL (default: https://raw.githubusercontent.com/JackyST0/awesome-rsshub-routes/main/feeds.opml)
OPML_URL=https://your-custom-opml-url.com/feeds.opml
```

### Content Sources

**Primary OPML**: [awesome-rsshub-routes](https://github.com/JackyST0/awesome-rsshub-routes)

**Additional VPS/Hosting Feeds**:
- NodeLoc (Latest & Top)
- LowEndTalk (Discussions, Offers, Requests)
- LowEndSpirit
- WebHostingTalk
- HostAdvice
- Reddit (r/VPS, r/webhosting, r/HomeNetworking)

Categories include: Tech Communities, AI, Tech Media, Big Tech Blogs, Frontend/Design, Language Blogs, Weeklies, Security, Tools, RSS Tools, News, Academia, and VPS/Hosting.

## Project Structure 📁

```
├── app/
│   ├── api/
│   │   ├── feed/          # Paginated feed API
│   │   └── categories/    # Categories list API
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Main page (client component)
│   └── globals.css        # Global styles
├── components/
│   ├── Feed.tsx           # Main feed with infinite scroll
│   ├── FeedCard.tsx       # Individual card component
│   ├── CategoryChips.tsx  # Category filter chips
│   ├── SearchBar.tsx      # Search input
│   └── ThemeToggle.tsx    # Dark mode toggle
├── lib/
│   ├── types.ts           # TypeScript interfaces
│   └── rss-parser.ts      # RSS/OPML parsing logic
└── public/                # Static assets
```

## Performance Optimization 🎯

- **Server-Side Caching**: 30-minute revalidation on API routes
- **Image Optimization**: Next.js Image component with responsive sizes
- **Lazy Loading**: Intersection Observer for infinite scroll
- **Debounced Search**: 300ms delay to reduce re-renders
- **Deduplication**: Removes duplicate articles by ID/link

## Browser Support 🌐

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License 📄

MIT

## Contributing 🤝

Contributions welcome! Please open an issue or PR.

---

Built with ❤️ using Next.js and deployed on Vercel
