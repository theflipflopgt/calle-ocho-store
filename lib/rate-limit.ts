interface RateLimitOptions {
  bucket: string;
  key: string;
  max: number;
  windowMs: number;
}

interface BucketEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const buckets = new Map<string, Map<string, BucketEntry>>();

function getBucket(bucket: string): Map<string, BucketEntry> {
  const existing = buckets.get(bucket);
  if (existing) {
    return existing;
  }

  const created = new Map<string, BucketEntry>();
  buckets.set(bucket, created);
  return created;
}

export function consumeRateLimit({
  bucket,
  key,
  max,
  windowMs,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const bucketMap = getBucket(bucket);
  const current = bucketMap.get(key);

  if (!current || current.resetAt <= now) {
    bucketMap.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      remaining: Math.max(max - 1, 0),
      retryAfterSeconds: 0,
    };
  }

  if (current.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000),
    };
  }

  current.count += 1;
  bucketMap.set(key, current);

  return {
    allowed: true,
    remaining: Math.max(max - current.count, 0),
    retryAfterSeconds: 0,
  };
}

export function getClientIpFromHeaders(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return headers.get('x-real-ip') || 'unknown';
}
