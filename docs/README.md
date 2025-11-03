# Documentation Index

This directory contains specialized documentation for Typing Toy.

## Available Documentation

### 📋 Core Documentation (Root Directory)

- **[README.md](../README.md)** - Project overview, tech stack, and quick start
- **[GETTING_STARTED.md](../GETTING_STARTED.md)** - Detailed setup and installation guide
- **[ARCHITECTURE.md](../ARCHITECTURE.md)** - Technical architecture and design decisions
- **[CLAUDE.md](../CLAUDE.md)** - Claude AI integration guide

### 📚 Specialized Guides (This Directory)

- **[DOCKER.md](./DOCKER.md)** - Complete Docker deployment guide
  - Quick start instructions
  - Production deployment
  - Commands reference
  - Troubleshooting

- **[FEATURES.md](./FEATURES.md)** - Detailed feature documentation
  - Authentication system (Email/Password, Google OAuth)
  - Visual learning features (Virtual keyboard, Hand diagrams)
  - Tips banner for user engagement

- **[SEO_GUIDE.md](./SEO_GUIDE.md)** - SEO configuration and best practices
  - Metadata setup
  - Sitemap configuration
  - Search engine submission
  - Analytics integration

## Quick Links

### For New Developers
1. Start with [README.md](../README.md) for project overview
2. Follow [GETTING_STARTED.md](../GETTING_STARTED.md) for setup
3. Review [ARCHITECTURE.md](../ARCHITECTURE.md) for technical details

### For Deployment
1. Development: [GETTING_STARTED.md](../GETTING_STARTED.md)
2. Docker: [DOCKER.md](./DOCKER.md)
3. Production: [DOCKER.md](./DOCKER.md#production-deployment)

### For Feature Implementation
1. Authentication: [FEATURES.md](./FEATURES.md#authentication-system)
2. Visual Components: [FEATURES.md](./FEATURES.md#visual-learning-features)
3. User Engagement: [FEATURES.md](./FEATURES.md#tips-banner)

### For SEO & Marketing
1. SEO Setup: [SEO_GUIDE.md](./SEO_GUIDE.md)
2. Metadata: [SEO_GUIDE.md](./SEO_GUIDE.md#metadata-implementation)
3. Analytics: [SEO_GUIDE.md](./SEO_GUIDE.md#analytics-setup)

## Documentation Structure

```
typingtoy/
├── README.md                    # Project overview
├── GETTING_STARTED.md           # Setup guide
├── ARCHITECTURE.md              # Technical architecture
├── CLAUDE.md                    # Claude AI guide
│
└── docs/                        # Specialized documentation
    ├── README.md                # This file
    ├── DOCKER.md                # Docker deployment
    ├── FEATURES.md              # Feature documentation
    └── SEO_GUIDE.md             # SEO guide
```

## Recent Changes

**November 2025:**
- ✅ Consolidated documentation from 14 files to 8 files
- ✅ Removed completed task summaries
- ✅ Merged related documentation:
  - AUTH_SETUP.md + VISUAL_FEATURES.md + TIPS_BANNER.md → FEATURES.md
  - DOCKER_DEPLOYMENT.md + QUICK_START.md → DOCKER.md
- ✅ Organized specialized docs into `/docs` directory
- ✅ Updated all cross-references

## Contributing

When adding new documentation:
1. Place general documentation in the root directory
2. Place specialized guides in `/docs`
3. Update this index file
4. Update cross-references in README.md

---

**Last Updated:** November 2025
