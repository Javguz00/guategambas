const runtimeUrl = process.env.DATABASE_URL;
const migrationUrl = process.env.DIRECT_URL || runtimeUrl;

function validate(name, value) {
  if (!value) {
    throw new Error(`${name} is missing`);
  }

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} is not a valid URL`);
  }

  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
    throw new Error(`${name} points to localhost (${host})`);
  }
}

try {
  validate('DATABASE_URL', runtimeUrl);
  validate('DIRECT_URL', migrationUrl);
  console.log('Database URLs look valid for production.');
} catch (error) {
  console.error(`DB URL validation failed: ${error.message}`);
  process.exit(1);
}

