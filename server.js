const express = require("express");
const { Pool } = require("pg");

const app = express();

const pool = new Pool({
  host: process.env.POSTGRESQL_ADDON_HOST,
  port: process.env.POSTGRESQL_ADDON_PORT,
  database: process.env.POSTGRESQL_ADDON_DB,
  user: process.env.POSTGRESQL_ADDON_USER,
  password: process.env.POSTGRESQL_ADDON_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

app.use(express.urlencoded({ extended: false }));

const escapeHtml = (text) =>
  text.replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));

app.get("/", async (req, res) => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wisdom (
      id SERIAL PRIMARY KEY,
      text VARCHAR(160) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const { rows } = await pool.query(
    "SELECT * FROM wisdom ORDER BY created_at DESC LIMIT 20"
  );

  const waffles = rows.length
    ? rows.map(w => `
        <div class="waffle">
          🧇 ${escapeHtml(w.text)}
        </div>
      `).join("")
    : `<p class="empty">The wall is hungry. Feed it some wisdom.</p>`;

  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Devoxx Waffle Wall</title>
  <style>
    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: system-ui, sans-serif;
      background: #ffd90f;
      color: #171717;
    }

    main {
      max-width: 600px;
      margin: auto;
      padding: 32px 20px;
    }

    h1 {
      font-size: 2.5rem;
      margin-bottom: 5px;
    }

    .subtitle {
      margin-top: 0;
      font-weight: 600;
    }

    form {
      display: flex;
      gap: 8px;
      margin: 30px 0;
    }

    input {
      flex: 1;
      padding: 15px;
      border: 3px solid #171717;
      border-radius: 10px;
      font-size: 16px;
      min-width: 0;
    }

    button {
      background: #171717;
      color: white;
      border: 0;
      border-radius: 10px;
      padding: 12px 16px;
      font-weight: bold;
    }

    .waffle {
      background: white;
      padding: 16px;
      margin: 12px 0;
      border: 3px solid #171717;
      border-radius: 12px;
      box-shadow: 5px 5px 0 #171717;
    }

    .empty { opacity: .7; }

    footer {
      margin-top: 35px;
      font-size: 13px;
    }
  </style>
</head>

<body>
<main>
  <h1>🧇 Devoxx Waffle Wall</h1>
  <p class="subtitle">Belgian waffles. Developer wisdom.</p>

  <form method="POST">
    <input
      name="text"
      maxlength="160"
      placeholder="Never deploy hungry..."
      required
    >
    <button>Stick it!</button>
  </form>

  <h2>Wall of Wisdom</h2>

  ${waffles}

  <footer>
    Built at Devoxx Belgium 🇧🇪 · Powered by Clever Cloud
  </footer>
</main>
</body>
</html>
  `);
});

app.post("/", async (req, res) => {
  const text = req.body.text?.trim();

  if (text) {
    await pool.query(
      "INSERT INTO wisdom(text) VALUES($1)",
      [text.slice(0, 160)]
    );
  }

  res.redirect("/");
});

app.listen(process.env.PORT || 8080, "0.0.0.0", () => {
  console.log("🧇 Waffle Wall is running");
});
