const runtimeUrl = process.env.DATABASE_URL;
const migrationUrl = process.env.DIRECT_URL || runtimeUrl;

function normalizeValue(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  const firstChar = trimmed[0];
  const lastChar = trimmed[trimmed.length - 1];
  if ((firstChar === '"' || firstChar === "'") && firstChar === lastChar) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function getScheme(value) {
  const match = value.match(/^([a-z][a-z0-9+.-]*):\/\//i);
  return match?.[1]?.toLowerCase() || '';
}

function extractHost(value) {
  try {
    return new URL(value).hostname;
  } catch {
    // Fallback that does not choke on special chars in passwords. We parse
    // the authority and split on the last @ to isolate host:port.
    const schemeMatch = value.match(/^[a-z][a-z0-9+.-]*:\/\//i);
    if (!schemeMatch) {
      return '';
    }

    const afterScheme = value.slice(schemeMatch[0].length);
    const slashIndex = afterScheme.indexOf('/');
    const authority = slashIndex >= 0 ? afterScheme.slice(0, slashIndex) : afterScheme;

    const atIndex = authority.lastIndexOf('@');
    const hostPort = atIndex >= 0 ? authority.slice(atIndex + 1) : authority;
    const hostPortWithoutParams = hostPort.split(/[?#]/)[0] || '';

    if (hostPortWithoutParams.startsWith('[')) {
      const ipv6End = hostPortWithoutParams.indexOf(']');
      return ipv6End > 1 ? hostPortWithoutParams.slice(1, ipv6End) : '';
    }

    return hostPortWithoutParams.split(':')[0] || '';
  }
}

function validate(name, value) {
  const normalizedValue = normalizeValue(value);
  if (!normalizedValue) {
    throw new Error(`${name} is missing`);
  }

  const scheme = getScheme(normalizedValue);
  const allowedSchemes = name === 'DATABASE_URL'
    ? new Set(['postgres', 'postgresql', 'prisma'])
    : new Set(['postgres', 'postgresql']);

  if (!allowedSchemes.has(scheme)) {
    const allowedList = Array.from(allowedSchemes).map((item) => `${item}://`).join(' or ');
    throw new Error(`${name} must use ${allowedList}`);
  }

  const host = extractHost(normalizedValue).toLowerCase();
  if (!host) {
    throw new Error(`${name} is not a valid URL`);
  }

  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
    throw new Error(`${name} points to localhost (${host})`);
  }

  // Safe diagnostics for CI logs (no credentials, no query params).
  console.log(`${name} validated (scheme=${scheme}, host=${host})`);
}

try {
  validate('DATABASE_URL', runtimeUrl);
  validate('DIRECT_URL', migrationUrl);
  console.log('Database URLs look valid for production.');
} catch (error) {
  console.error(`DB URL validation failed: ${error.message}`);
  process.exit(1);
}

