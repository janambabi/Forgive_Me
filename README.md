# Forgive Me - Web App

This is a Vite + React + Tailwind project created for the "Forgive Me" interactive page.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Add your celebration audio file:
   Place an mp3 file at `public/assets/celebration.mp3`. If you skip this step the audio control will be present but no sound will play.

3. Run dev server:
   ```
   npm run dev
   ```

## Notes

- Responses are stored in the browser `localStorage`. To collect responses on a server, set `WEBHOOK_URL` inside `src/components/ForgiveMe.jsx` to your endpoint.
- Change `ADMIN_PIN` in the same file to protect the admin panel.
