import Redis from 'ioredis';

let redis: Redis | null = null;
let redisDisabled = false;

function getRedis(): Redis | null {
  if (redisDisabled) return null;
  if (redis) return redis;
  try {
    redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    });
    redis.on('error', () => {
      // Never crash the request path because Redis is unavailable.
      redisDisabled = true;
    });
    return redis;
  } catch {
    redisDisabled = true;
    return null;
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
}

/**
 * Sliding-window rate limit backed by a Redis sorted set. Fails open — if Redis
 * is unreachable the request is allowed, so local dev works without Redis.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const client = getRedis();
  if (!client) return { success: true, remaining: limit, limit };

  const redisKey = `ratelimit:${key}`;
  const now = Date.now();
  const windowStart = now - windowSeconds * 1000;

  try {
    const results = await client
      .multi()
      .zremrangebyscore(redisKey, 0, windowStart)
      .zadd(redisKey, now, `${now}-${Math.random()}`)
      .zcard(redisKey)
      .expire(redisKey, windowSeconds)
      .exec();

    const count = (results?.[2]?.[1] as number) ?? 0;
    return {
      success: count <= limit,
      remaining: Math.max(0, limit - count),
      limit,
    };
  } catch {
    return { success: true, remaining: limit, limit };
  }
}
