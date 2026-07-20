// Root-level entry point. Some hosts (Render, and Node hosting generally)
// default to `node index.js` regardless of package.json's "scripts.start"
// if the dashboard's Start Command isn't explicitly set to `npm start` —
// this file exists purely so that fallback still finds the real server
// instead of throwing MODULE_NOT_FOUND. The actual app lives in src/.
import "./src/server.js";
