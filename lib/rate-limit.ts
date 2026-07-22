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

interface PersistentRateLimitOptions extends RateLimitOptions {
  db?: any;
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

export async function consumePersistentRateLimit({
  bucket,
  key,
  max,
  windowMs,
  db,
}: PersistentRateLimitOptions): Promise<RateLimitResult> {
  const fallback = consumeRateLimit({ bucket, key, max, windowMs });

  if (!fallback.allowed || !db) {
    return fallback;
  }

  try {
    const { data, error } = await db.rpc('consume_rate_limit', {
      p_bucket: bucket,
      p_key: key,
      p_max: max,
      p_window_seconds: Math.max(Math.ceil(windowMs / 1000), 1),
    });

    if (error || !data) {
      return fallback;
    }

    return {
      allowed: Boolean(data.allowed),
      remaining: Number(data.remaining ?? 0),
      retryAfterSeconds: Number(data.retryAfterSeconds ?? 0),
    };
  } catch {
    return fallback;
  }
}

export function getClientIpFromHeaders(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return headers.get('x-real-ip') || 'unknown';
}
