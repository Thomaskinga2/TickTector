// PreToolUse hook: stop the agent from reading or editing .env files, which hold secrets.
// Only path- and command-like tool inputs are checked, so docs that mention .env.local still save.
// Exit 2 blocks the tool call and sends stderr to the agent.

const ENV_FILE = /^\.env(\.[\w-]+)*$/;
const ALLOWED = new Set(['.env.example']);
const CHECKED_KEYS = /path|file|command|cmd|target|glob|pattern/i;

let input = '';
for await (const chunk of process.stdin) input += chunk;

let event;
try {
  event = JSON.parse(input);
} catch {
  process.exit(0);
}

const values = [];
function collect(value, key = '') {
  if (typeof value === 'string') {
    if (CHECKED_KEYS.test(key)) values.push(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collect(item, key));
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([k, v]) => collect(v, k));
  }
}
collect(event?.tool_input);

const hit = values
  .flatMap((value) => value.split(/[\s"'`=<>|;&()]+/))
  .map((token) => token.split(/[\\/]/).pop() ?? '')
  .find((name) => ENV_FILE.test(name) && !ALLOWED.has(name));

if (hit) {
  process.stderr.write(
    `Blocked: ${hit} holds secrets, so the agent doesn't read or edit it. ` +
      'Ask the user to change it, and document new variables in .env.example.\n',
  );
  process.exit(2);
}
