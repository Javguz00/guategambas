const runtimeUrl = process.env.DATABASE_URL;
const migrationUrl = process.env.DIRECT_URL || runtimeUrl;

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
    const authorityMatch = value.match(/^[a-z][a-z0-9+.-]*:\/\/([^/?#]*)/i);
    if (!authorityMatch) {
      return '';
    }

    const authority = authorityMatch[1];
    const atIndex = authority.lastIndexOf('@');
    const hostPort = atIndex >= 0 ? authority.slice(atIndex + 1) : authority;

    if (hostPort.startsWith('[')) {
      const ipv6End = hostPort.indexOf(']');
      return ipv6End > 1 ? hostPort.slice(1, ipv6End) : '';
    }

    return hostPort.split(':')[0] || '';
  }
}

function validate(name, value) {
  if (!value) {
    throw new Error(`${name} is missing`);
  }

  const scheme = getScheme(value);
  const allowedSchemes = name === 'DATABASE_URL'
    ? new Set(['postgres', 'postgresql', 'prisma'])
    : new Set(['postgres', 'postgresql']);

  if (!allowedSchemes.has(scheme)) {
    const allowedList = Array.from(allowedSchemes).map((item) => `${item}://`).join(' or ');
    throw new Error(`${name} must use ${allowedList}`);
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

