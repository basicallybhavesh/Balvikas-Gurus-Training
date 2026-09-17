# Online Games

Seven browser games with a leaderboard per game. Plain HTML, CSS and JavaScript
with a handful of serverless functions — there is no build step and no framework.
It runs on the Vercel free tier with a Neon Postgres database.

Works on phones and desktops. No login, no accounts: a player types a name at the
end of a game and that name is remembered on their device for the next one.

---

## The seven games

| # | Page | What it is | Top score |
|---|------|-----------|-----------|
| 1 | `/pic-values` | One picture, many values. Tick every value the picture really shows. | 1500 |
| 2 | `/matching` | Drag each shrine onto the place it stands in. Three rounds, fourteen shrines. | 1400 |
| 3 | `/unscramble` | Rebuild the scattered word before the fuse burns out. Ten words. | 2000 |
| 4 | `/who-said-it` | A quote appears and the bar falls. Name the speaker. Eight quotes. | 1520 |
| 5 | `/guess-who` | Half a face, uncovering second by second. Three faces. | 1200 |
| 6 | `/count-faces` | A crowd flashes up, then the lights go out. Count the smiling ones. Six rounds. | 900 |
| 7 | `/identify` | A picture clears out of the mist. Name it early. Five pictures. | 1500 |

Boards rank on points first; a tie goes to whoever finished faster. The clock
stops before the name box appears, so spelling a name slowly costs nothing.

---

## Getting it online

You need three free accounts: GitHub, Vercel and Neon. About fifteen minutes.

### 1. Put the code on GitHub

Unzip this folder, then in a terminal inside it:

```bash
git init
git add .
git commit -m "Seven games with leaderboards"
```

On github.com click **New repository**, name it (for example `online-games`),
leave it empty — no README, no .gitignore — and click **Create**. GitHub then
shows you two lines to copy. They look like this:

```bash
git remote add origin https://github.com/YOUR-NAME/online-games.git
git branch -M main
git push -u origin main
```

Run them. Your code is now on GitHub.

### 2. Create the database on Neon

1. Sign in at **neon.com** and click **New project**.
2. Name it, pick the region closest to your players (Singapore or Mumbai for
   South Asia), and create it.
3. On the project dashboard find **Connection string**. Make sure the
   **Pooled connection** toggle is on, then copy the string. It starts with
   `postgresql://` and contains `-pooler` in the host name.

Keep that string on your clipboard for the next step. Pooled is important —
serverless functions open and close connections constantly, and the unpooled
string will run you out of connections.

### 3. Deploy on Vercel

1. Sign in at **vercel.com** with your GitHub account.
2. **Add New → Project**, and import the repository you just pushed.
3. Framework preset: **Other**. Leave the build and output settings empty.
4. Open **Environment Variables** and add two, before deploying:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | the pooled Neon string you copied |
   | `ADMIN_PASSWORD` | `QWERTY@100`, or anything else you prefer |

5. Click **Deploy**. It takes under a minute.

### 4. Create the table

Visit `https://your-project.vercel.app/admin-3748dh`. The browser asks for a
username and password: put anything as the username and your `ADMIN_PASSWORD`
as the password.

Click **Set up tables** once. That is the whole database setup. Play a game,
save a score, and check that it appears on the board.

### Changing anything later

Edit the files, then:

```bash
git add .
git commit -m "what changed"
git push
```

Vercel redeploys within a minute. There is nothing else to press.

---

## The admin panel

`/admin-3748dh`, password `QWERTY@100` until you change `ADMIN_PASSWORD` in
Vercel. It gives you:

- how many attempts each game has, its top score, when it was last played
- **Clear** on any single game, leaving the other six untouched
- **Clear every leaderboard**, which additionally makes you type `ERASE`
- the last 25 entries with a **Remove** button each, for pulling out one rude
  name without wiping a whole board
- **Set up tables**, safe to press at any time

The password sits in an environment variable, not in the code, so changing it
does not require a new deploy — set the new value in Vercel and redeploy once.

To change the secret URL itself, edit the `source` line in `vercel.json`.

---

## Editing the content

### The name of the event

`assets/site.js`. Three lines, and every page, browser tab and footer follows.

```js
window.SITE = {
  name: 'Online Games',
  tagline: 'Seven rounds. Play on your phone or the big screen...',
  footer: 'Online Games'
};
```

### The questions

Every game keeps its content in its own `data.js`, separate from the code that
runs it. Open `matching/data.js` and you will see the shrines; open
`who-said-it/data.js` and you will see the quotes. Add a round, change a clue,
swap a picture — the game reads however much is there and adjusts the maximum
score by itself.

A few specifics:

- **`pic-values/data.js`** — `shows` are the values genuinely in the picture,
  `absent` are the plausible words that are not. Both lists drive the scoring.
- **`unscramble/data.js`** — words in capitals, letters only. `pair` is the
  twin shown after solving.
- **`who-said-it/data.js`** — you write only the true speaker; three wrong
  options are drawn from the `speakers` list automatically.
- **`count-faces/data.js`** — no pictures at all. The crowd is drawn fresh in
  the browser every round, so the answer is never the same twice and nobody can
  memorise it from someone else's attempt. Change `total`, the `min`/`max`
  range for the happy ones, the `seconds` on screen, and `drift`.

### The pictures

All thirteen came out of your Word document and are in `assets/img/`. Replace a
file with a better one of the same name and nothing else needs changing —
every image sits in a fixed-ratio frame and crops rather than distorts.

Worth knowing: the three cricketer photographs are small (97 to 192 pixels
wide) and will look soft blown up to 300 pixels in Guess Who. Larger versions
would help that game more than any other.

Recommended sizes:

| Used in | Shape | Size |
|---------|-------|------|
| `guess-who` | square face crop | 600 × 600 |
| `identify` | portrait | 800 × 1000 |
| `pic-values` | landscape scene | 1200 × 900 |
| `matching` | landscape | 800 × 600 |

One thing to check before you publish: `markandeya.png` is the figure in the
flames. I matched the five pictures to the five names in your document by what
each one shows, and that is the only pairing I am not certain of — it could be
Prahlada in Holika's fire. The note is repeated in `identify/data.js`.

### Adding an eighth game

1. Make a folder with `index.html`, `data.js` and `game.js` — copy the closest
   existing game and work from it.
2. Add the slug to the `GAMES` list in `api/_db.js`. The server only accepts
   scores for games on that list, and the admin panel reads the same list.
3. Add a tile to `index.html`.

---

## How it fits together

```
index.html            the hub
assets/site.js        the event name, in one place
assets/core.css       the shared look
assets/core.js        clock, score, sounds, drag-and-drop, result sheet, boards
assets/img/           every picture
api/_db.js            Neon client, the list of games, the schema, admin auth
api/score.js          POST a score; validates, clamps, returns the player's rank
api/leaderboard.js    GET a board
api/admin.js          asks for the password, then serves the panel
api/admin-action.js   the panel's buttons
<slug>/index.html     one page per game
<slug>/data.js        its content
<slug>/game.js        its rules
```

Scores live in one table:

```sql
CREATE TABLE scores (
  id          BIGSERIAL PRIMARY KEY,
  game        TEXT        NOT NULL,
  player      TEXT        NOT NULL,
  score       INTEGER     NOT NULL,
  max_score   INTEGER     NOT NULL,
  duration_ms INTEGER     NOT NULL,
  meta        JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

The server rejects any game slug it does not recognise, trims names to 24
characters, strips control characters out of them, and refuses to record a
score higher than the maximum the game can award. It is a friendly audience, so
there is nothing heavier than that — anyone determined enough can still open
the console and post a number. If that ever matters, the fix is to move scoring
to the server, and the `meta` column is where the evidence would go.

Dragging is built on pointer events rather than the HTML5 drag API, so a
finger, a stylus and a mouse all behave the same. Tapping works as well:
tap a label, then tap its box. Tap a filled box to take the label back out.

---

## Running it on your own machine

```bash
npm install -g vercel
vercel dev
```

Then open `http://localhost:3000`. Put `DATABASE_URL` and `ADMIN_PASSWORD` in a
`.env.local` file first — see `.env.example`. Opening `index.html` straight from
the file system will show the games but the leaderboards will not work, because
there is no server to answer `/api/...`.
