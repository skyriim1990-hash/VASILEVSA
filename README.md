# Alexandre Vassilev-Vasilevsa — official website

First working version. Contemporary artist site: gallery, editorial
publication and archive rather than a portfolio template.

Static Astro build. No CMS, no backend, no framework runtime — the pages
ship as HTML with a few kilobytes of hand-written JavaScript for the mobile
menu, the works filter and the scroll reveals.

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # -> dist/
npm run preview
```

---

## Before this goes live

These are the only things that block launch. Each is a one-line change.

| # | What | Where |
|---|------|-------|
| 1 | Replace `https://example.com` with the real domain | `astro.config.mjs`, `public/robots.txt` |
| 2 | Point the contact form at a mailbox or form endpoint | `src/components/ContactForm.astro` → `const endpoint` |
| 3 | Add artwork photography | `public/artworks/` + `src/data/artworks.js` |
| 4 | Add the artist portrait | see *Portrait* below |
| 5 | Add real exhibition history | `src/data/exhibitions.js` |
| 6 | Write the Privacy and Terms copy | `src/views/LegalView.astro` |
| 7 | Add a 1200×630 social preview image | `public/og-image.jpg` + `src/layouts/BaseLayout.astro` → `const ogImage` |

Until 2 is done the contact form validates, refuses to pretend it sent
anything, and says so.

---

## Placeholders

Nothing on this site is invented. No artwork titles, years, dimensions,
mediums, prices, galleries, exhibitions, awards, athlete names, quotes,
collectors, social profiles or contact details have been made up.

Where data is missing the site prints a marked placeholder:

- **Images** — a tonal paper field with a hairline frame and the crossed
  "unplaced image" mark from print production, labelled and numbered.
  Deliberately not a grey wireframe box, and impossible to mistake for a
  painting.
- **Text data** — an em dash, or the name of the field that belongs there
  (`Exhibition title`, `Gallery or institution`), set back in a lighter tone.
- **Disclosure** — every page carrying placeholders states plainly, in a
  footnote, that they are not works by the artist.

### Replacing a placeholder image

Every image on the site goes through one component, `src/components/Media.astro`.
Give it a `src` and it renders a real lazy-loaded `<img>`; leave `src` empty
and it renders the placeholder — in the *same* ratio-reserved box.

So adding photography is data entry, not design work:

```js
// src/data/artworks.js
{
  id: 'artwork-01',
  title: 'Real title',
  year: '2019',
  medium: 'Oil on canvas',
  dimensions: '180 × 140 cm',
  image: '/artworks/artwork-01.jpg',
  ratio: '3 / 4',            // the file's true aspect ratio
}
```

Set `ratio` to the real proportions of the file. It reserves the space
before the image loads, which is what stops the page jumping.

### Portrait

The portrait appears in two places — the About page and the homepage teaser.
Drop the file at `public/portrait.jpg` and pass it to both `<Media>` calls
(`src="/portrait.jpg"` plus a real `alt`) in `src/views/AboutView.astro` and
`src/views/HomeView.astro`.

---

## Structure

```
src/
  data/            content.js  <- what the public pages read
                   artworks.js, exhibitions.js  <- the fallback behind it
  lib/supabase/    env, client, server, admin, storage  <- backend wiring
  lib/admin/       auth, queries, media, forms, *Form  <- the admin panel
  middleware.js    the /admin gate
  i18n/            ui.js (every string), utils.js (routing)
  components/      Navigation, Footer, Media, ArtworkCard, ArtworkGrid,
                   SectionHeader, PageHeader, ExhibitionItem, Statistics,
                   ContactForm
    admin/         Field, Toggle, Note, Thumb, Pager, ImageField,
                   ConfirmAction, ArtworkForm, ExhibitionForm, SectionsEditor
  views/           one file per page body
  layouts/         BaseLayout.astro  <- head, SEO, fonts, reveal observer
                   AdminLayout.astro <- the admin frame, noindex
  pages/           thin routes
    admin/         the panel — every file server-rendered
  styles/          global.css  <- tokens, type scale, grid, shared classes
                   admin.css   <- the panel only, never loaded publicly
```

Page bodies live in `views/` and each is rendered by two thin route files,
one per language. Adding a page means one view and two four-line routes.

### Scaling the archive

The grids, filters, detail pages and prev/next links are all generated from
`artworks.js`. Twenty works, fifty, or two hundred need no layout changes —
only more entries. The `category` field drives the filters; the id list in
`CATEGORIES` is the single place they are defined.

---

## Supabase

The project is wired to Supabase project **Vasilevsa**, but nothing on the
public site reads from it yet. The site still builds fully static from
`src/data/*.js`, and it builds fine with an empty `.env`.

### Setup

```bash
cp .env.example .env    # then fill it in
```

Values come from the Supabase dashboard, **Project Settings → API**. Restart
the dev server afterwards — Astro reads `.env` at startup.

| Variable | Reaches the browser | Notes |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | yes | project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | yes | public by design, constrained by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | **no** | bypasses RLS — server only, may be left blank |

The `PUBLIC_` prefix is what Astro uses to decide whether a value may be
inlined into client-side code. The service-role key does not have it, and
`admin.js` additionally throws if it ever executes in a browser.

`.env` is already in `.gitignore`. In production set these in the host's
environment panel rather than shipping a file.

### Which client to use

| File | Credential | Runs | For |
|---|---|---|---|
| `client.js` | anon | browser | sign-in, uploads, realtime |
| `server.js` | anon | server | reading the user before render, route guards |
| `admin.js` | service role | server | migrations, jobs, webhooks — rarely |

Ordinary admin-panel work goes through `server.js` and is authorised by Row
Level Security policies. `admin.js` is the exception, not the default: a bug
in a page that uses the anon client cannot escalate into full database access,
and one that uses the service role can.

Import from `lib/supabase/index.js`. The admin client is deliberately not
re-exported there — it must be imported from `./admin.js` explicitly, so that
the choice is visible in a diff.

### Storage

`storage.js` names three buckets (`artworks`, `portraits`, `artsport`) and
builds public URLs. The admin-access migration creates them.

`Media.astro` takes a `src` string and does not care whether it points at
`/artworks/foo.jpg` or at a Supabase URL. `publicUrl()` returns `''` when
anything is missing, and `''` is what `Media.astro` already treats as "render
the placeholder".

---

## The admin panel

`/admin`, behind a Supabase Auth sign-in. Add, edit, publish and delete
artworks and exhibitions, upload photography, edit the About and Art × Sport
sections, manage categories and the media library.

### Setting it up

Both migrations in `supabase/migrations/` have to be run, in order, in the
dashboard **SQL Editor**. Then:

1. **Authentication → Users → Add user.** Real address and password, with
   *Auto Confirm User* ticked.
2. **SQL Editor**, with that address:

   ```sql
   insert into public.admin_users (user_id, email)
   select id, email from auth.users where email = 'you@example.com'
   on conflict (user_id) do nothing;
   ```

3. **Authentication → URL Configuration.** Set **Site URL** to the origin the
   app is actually served from, and add the recovery callback to **Redirect
   URLs**:

   | | |
   |---|---|
   | Site URL | `http://localhost:4321` |
   | Redirect URLs | `http://localhost:4321/admin/auth/callback` |

   Both change to the real domain when the site goes live. A fresh Supabase
   project ships with `http://localhost:3000` here, which is a port nothing in
   this repository listens on.

4. `npm run dev`, then <http://localhost:4321/admin>.

Signing in before step 2 lands on a page that says so and prints the SQL with
the address already filled in.

### Forgotten passwords

`/admin/forgot-password` asks Supabase to email a link; the link lands on
`/admin/auth/callback`, which turns it into a session and forwards to
`/admin/reset-password`. Saving a new password there ends every other session
on the account and sends you back to sign in.

Three things about it are worth knowing before debugging it:

- **Step 3 above is not optional.** A `redirectTo` that is not on the Redirect
  URLs list is not refused — it is silently swapped for the Site URL. The
  failure looks like the app asking for the wrong address, and it is not.
- **The link must be opened in the browser it was requested from.** The request
  leaves a one-time key in a cookie there, and the link is checked against it.
  A link opened on a phone after being requested on a laptop cannot complete,
  and the page says so rather than showing a blank form.
- **Links sent from the dashboard's own *Send password recovery* button** carry
  the credential in the URL fragment instead, which no server ever receives.
  The callback handles that too, in the browser — those links need JavaScript,
  the ones from `/admin/forgot-password` do not.

`PUBLIC_SITE_URL` in `.env` overrides the origin the link is built from. Leave
it blank unless a proxy sits in front of the app; the request's own origin is
correct otherwise.

### How access actually works

Three layers, and only the third is load-bearing.

| | What it does | What happens without it |
|---|---|---|
| `middleware.js` | redirects a signed-out visitor to the login page | pages render, queries are refused, tables look empty |
| `is_admin()` check | tells the panel to explain itself | same |
| **Row Level Security** | **refuses the query** | **anyone could write** |

The panel signs in as an ordinary Supabase user and every statement it issues
carries that session. `SUPABASE_SERVICE_ROLE_KEY` is not used anywhere in this
project and can stay empty — permission is a row in `public.admin_users`, not
a credential the server holds. A route that forgets its guard still writes
nothing.

The login, logout and the three recovery pages are exempt from the first layer
— they exist for someone who cannot sign in, so requiring a sign-in would make
them unreachable exactly when they are needed. None of them reads or writes
site content, so the third layer is untouched by the exemption.

The buckets are publicly readable and admin-writable. That is deliberate: the
public pages are prerendered, and a signed URL generated at build time expires
long before the page does. The migration explains the trade in full.

### The adapter

`output` stays `static`. `@astrojs/node` is installed so `/admin` has a request
cycle to keep a session cookie in; every admin route carries
`export const prerender = false` and nothing else does. All 21 public pages are
still prerendered to plain HTML and are byte-identical to the build before the
panel existed.

Swapping hosts is one import and one line in `astro.config.mjs` —
`@astrojs/vercel`, `@astrojs/netlify` and `@astrojs/cloudflare` are drop-in.

### Publishing is not deploying

The public site reads Supabase **at build time**. Publishing a work changes the
database immediately and changes the live site at the next build. Until then
the visitor sees what they saw before.

### The changeover

`src/data/content.js` asks Supabase for published content and falls back to
`src/data/artworks.js` and `src/data/exhibitions.js` when there is none. The
database is empty today, so the site renders exactly what it always has. The
first published work switches it over, with no code change.

Those two files hold twelve and eight placeholder entries with every content
field empty — they were written to give the layout something to lay out.
`npm run legacy-sql` checks them for anything real and writes SQL for it; run
today it reports nothing to migrate, which is correct.

---

## Design notes

**Colour.** Paper `#F7F6F2`, ink `#111111`, secondary `#666666`, rules
`#D8D6D0`, accent `#E86A2A`. The orange appears in five places only: the
period after the artist's name, the `×` in Art × Sport, the active
navigation item, hover states, and the index numeral on a placeholder. All
other colour is meant to arrive with the paintings.

Measured against paper:

| Token | Hex | Ratio | Use |
|---|---|---|---|
| `--ink` | `#111111` | 18.6 : 1 | body, headings |
| `--ink-soft` | `#666666` | 5.3 : 1 | secondary text |
| `--ink-faint` | `#74706A` | 4.6 : 1 | captions, tertiary text |
| `--ink-on-tint` | `#5F5C56` | 5.2 : 1 | text on a placeholder's tinted field |
| `--accent` | `#E86A2A` | 3.0 : 1 | large display marks only |
| `--accent-ink` | `#B4501C` | 4.7 : 1 | accent at text size, focus rings |

The brief's `#E86A2A` reaches 3.0 : 1, which is fine for the display marks
it was chosen for but not for an 11px navigation label. Rather than change
a specified brand colour, accent text and focus indicators use
`--accent-ink`, a darker step of the same hue.

**One known exception.** The two display-sized accent glyphs — the period
after the artist's name and the `×` in Art × Sport — measure 2.98 : 1
against a 3.0 : 1 requirement. Closing it means darkening `--accent` from
`#E86A2A` to about `#E56728`, a change invisible to the eye that clears
3.08 : 1. That is a one-line edit in `global.css`, held back because the
hex was specified.

**Type.** Instrument Serif for display, Golos Text for everything else.
Instrument Serif has no Cyrillic, so Prata — a didone of the same
temperament — sits behind it in the stack and takes the Bulgarian headings
rather than leaving them to whatever serif the operating system supplies.
Golos Text covers both scripts on its own, so body copy never changes face
mid-sentence around a Latin term. Each subset carries its own
`unicode-range`: an English page never downloads the Cyrillic files.

**Layout.** A 12-column grid with fluid gutters. Compositions are placed
asymmetrically and by hand on the homepage and Art × Sport; the works grid
staggers three columns with each work keeping its own aspect ratio.

**Mobile.** Recomposed rather than stacked. The homepage collage becomes a
lead image with two smaller works inset beneath it; grid items alternate
left and right insets so a single column still has rhythm; Art × Sport
chapters put the text before the image. Checked for horizontal overflow at
375, 430, 768, 1024 and 1440 — there is none.

**Motion.** Fade and 22px rise on entry, masked line reveals on headings,
1.028× image scale on hover. Slow easing, nothing bounces or spins. Fully
disabled under `prefers-reduced-motion`.

Every hidden-then-revealed state is scoped behind a `.js` class that an
inline head script adds before first paint. If the script never runs — no
JavaScript, a failed bundle, an `IntersectionObserver` that never fires —
the page renders as ordinary visible content instead of a blank sheet.
Content is never hidden by CSS that JavaScript is required to undo.

---

## Accessibility

Semantic landmarks, one `<h1>` per page with no skipped heading levels, a
skip link that moves focus (`main` carries `tabindex="-1"`) and clears the
sticky header (`scroll-padding-top`), visible focus rings at 4.7 : 1,
`aria-current` on the active nav item, a focus-trapped mobile menu that
closes on `Escape`, an exhibitions timeline marked up as a list, labelled
form fields with inline validation, and alt text on every image that is
replaced by the real artwork metadata as soon as it exists.

The current page is never signalled by colour alone — the active navigation
item and the active mobile menu item both carry a permanent rule alongside
the colour change.

Verified: 16 pages × colour-contrast sweep, 18 pages × 10 viewport widths
for horizontal overflow, heading order and duplicate ids on every page.

## Languages

English only. The Bulgarian locale, the `/bg/` routes and the language switch
were removed; this section still described them and has been corrected here
rather than left to mislead.

All copy is in `src/i18n/ui.js`.

A second language would come back through `translations`, a JSONB column on
every content table shaped `{ "bg": { "title": "…" } }`. It is empty, costs
nothing, and means the schema does not need migrating if the decision is
reversed. The admin panel does not write to it.
