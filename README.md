# Launchpad Project Workspace

/skill:migrate-external-project Source: code archive. Migrate the attached project into Lovable.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://launchpad-project-workspace.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fd5bb354-7408-487c-b02e-e375b5380c75).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

Before starting locally, copy `.env.example` to `.env` and fill in your Supabase project URL, project ID, and publishable key. Keep `.env` private; it is not included in the release ZIP.

## ImageSeal integrity workflow

ImageSeal computes SHA-256 in the browser from the exact image file that is stored. A matching digest means the file bytes match exactly. The visual comparison and pixel heatmap are approximate review aids and do not replace the hash result. Images remain in the private Supabase `images` bucket and are accessed through signed URLs.
