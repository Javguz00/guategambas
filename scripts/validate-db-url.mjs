const runtimeUrl = process.env.DATABASE_URL;
const migrationUrl = process.env.DIRECT_URL || runtimeUrl;

function extractHost(value) {
  // Primary: use the WHATWG URL parser
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    // Fallback for Postgres URLs whose passwords contain characters that are
    // valid in a connection string but cause new URL() to throw (e.g. '#', '%').
    // Find the hostname by splitting on the last '@' before any path delimiter.
    if (!/^(?:postgresql|postgres):\/\//i.test(value)) return null;
    const withoutScheme = value.replace(/^(?:postgresql|postgres):\/\//i, '');
    const atIdx = withoutScheme.lastIndexOf('@');
    const afterAt = atIdx >= 0 ? withoutScheme.slice(atIdx + 1) : withoutScheme;
    const hostMatch = afterAt.match(/^([^/?#:\[\]]+)/);
    return hostMatch ? hostMatch[1].toLowerCase() : null;
  }
}

function validate(name, value) {
  if (!value) {
    throw new Error(`${name} is missing`);
  }

  const host = extractHost(value);
  if (!host) {
    throw new Error(`${name} is not a valid URL`);
  }

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

