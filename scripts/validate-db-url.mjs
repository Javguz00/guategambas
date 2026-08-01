const runtimeUrl = process.env.DATABASE_URL;
const migrationUrl = process.env.DIRECT_URL || runtimeUrl;

function extractHost(value) {
  try {
    return new URL(value).hostname;
  } catch {
    // Fallback for passwords with characters that break WHATWG URL parsing
    // (for example # or invalid percent escape sequences).
    const match = value.match(/^postgres(?:ql)?:\/\/(?:.*@)?([^\/:?#]+)(?::\d+)?(?:[\/?#]|$)/i);
    return match?.[1] || '';
  }
}

function validate(name, value) {
  if (!value) {
    throw new Error(`${name} is missing`);
  }

  if (!/^postgres(?:ql)?:\/\//i.test(value)) {
    throw new Error(`${name} must use postgres:// or postgresql://`);
  }

  const host = extractHost(value).toLowerCase();
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

