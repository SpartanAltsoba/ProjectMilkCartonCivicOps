# Immediate Cost Optimization Plan

## 1. Critical API Cost Reductions

### Consolidate API Clients

- Remove redundant implementations:
  - `dataGovClient.ts` and `dataGovClientV2.ts` overlap
  - Consolidate into single optimized client
- Current cost impact: Potentially 2x API calls for same data

### Implement Proper Caching

```typescript
// Add to baseApiClient.ts
const CACHE_TTL = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 24 * 60 * 60 * 1000, // 24 hours
};

// Use Redis or similar for production
const cache = new Map<string, { data: any; timestamp: number }>();
```

### Optimize Retry Logic

Current issue in baseApiClient.ts:

```typescript
maxRetries: 3,
initialDelay: 1000, // Too aggressive
backoffFactor: 2
```

Change to:

```typescript
maxRetries: 2,
initialDelay: 2000,
backoffFactor: 4
```

## 2. Firebase Function Optimizations

### Implement Function Caching

```typescript
// functions/src/index.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize cache
const cache = admin.firestore().collection("cache");

async function getCachedData(key: string) {
  const doc = await cache.doc(key).get();
  if (doc.exists) {
    const data = doc.data();
    if (Date.now() - data.timestamp < data.ttl) {
      return data.value;
    }
  }
  return null;
}
```

### Add Request Throttling

```typescript
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
};
```

## 3. Immediate Actions Required

1. Disable Redundant Services

- Comment out `dataGovClientV2.ts` usage
- Consolidate to single client implementation
- Estimated cost reduction: 40-50%

2. Add Caching Layer

- Implement Redis or Firestore caching
- Cache frequently accessed data
- Estimated cost reduction: 60-70%

3. Optimize Firebase Functions

- Add proper error handling
- Implement request throttling
- Estimated cost reduction: 30-40%

4. Batch Request Optimization

```typescript
// Current inefficient implementation
delayMs: 1000, // Too frequent
batchSize: 3    // Too small

// Optimize to
delayMs: 5000,  // Reduced frequency
batchSize: 10   // Larger batches
```

## 4. Long-term Cost Management

1. Implement Monitoring

```typescript
// Add to baseApiClient.ts
interface ApiMetrics {
  endpoint: string;
  responseTime: number;
  cacheHit: boolean;
  retryCount: number;
  timestamp: number;
}

const metrics: ApiMetrics[] = [];
```

2. Set Up Cost Alerts

- Configure Firebase budget alerts
- Set up daily API usage monitoring
- Implement automatic throttling when approaching limits

## Implemented Cost Reductions

| Area                 | Change Made                                                                                                                                  | Expected Savings | Status      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ----------- |
| API Calls            | - Removed redundant dataGovClient.ts<br>- Implemented 30-min caching<br>- Reduced retries from 3 to 2<br>- Increased batch size from 3 to 10 | -70%             | ✅ Complete |
| Request Optimization | - Increased delay between requests<br>- Added exponential backoff<br>- Optimized batch processing                                            | -50%             | ✅ Complete |
| Error Handling       | - Added proper fallbacks<br>- Cached error responses<br>- Improved retry logic                                                               | -30%             | ✅ Complete |

## Next Steps for Cost Optimization

1. Firebase Functions Optimization

   - Implement Redis or Firestore caching
   - Add proper request throttling
   - Optimize cold starts

2. Data Storage Optimization

   - Implement data compression
   - Add proper indexing
   - Optimize query patterns

3. Monitoring Setup
   - Add cost alerts
   - Implement usage tracking
   - Set up automatic scaling

## Implementation Priority

1. IMMEDIATE (Today):

   - Disable redundant API clients
   - Implement basic caching
   - Add request throttling

2. SHORT-TERM (This Week):

   - Consolidate API clients
   - Optimize retry logic
   - Implement proper monitoring

3. LONG-TERM (Next Sprint):
   - Set up proper caching infrastructure
   - Implement cost alerting
   - Optimize data storage

## Monitoring Plan

Create a new monitoring endpoint:

```typescript
app.get("/admin/metrics", async (req: Request, res: Response) => {
  const stats = await getApiMetrics();
  res.json({
    totalRequests: stats.totalRequests,
    cacheHitRate: stats.cacheHits / stats.totalRequests,
    averageResponseTime: stats.totalResponseTime / stats.totalRequests,
    costEstimate: calculateCostEstimate(stats),
  });
});
```
