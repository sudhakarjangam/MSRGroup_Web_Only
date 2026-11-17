const express = require("express");
const fs = require("node:fs");
const path = require("node:path");

const app = express();
const browserDist = path.join(__dirname, "dist", "mystore-web", "browser");
const indexFile = path.join(browserDist, "index.html");

if (!fs.existsSync(indexFile)) {
  throw new Error("Angular build not found. Run `npm run build` before starting the server.");
}

app.use(express.static(browserDist));
app.use((req, res, next) => {
  if (req.method !== "GET" || path.extname(req.path)) {
    return next();
  }

  res.sendFile(indexFile, (error) => {
    if (error) {
      next(error);
    }
  });
});
app.use((req, res) => res.sendStatus(404));

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});
