import Redis from 'ioredis';
import crypto from 'crypto';

export interface JobPayload {
  scenario_hash: string;
  stage: 'recon' | 'correlation' | 'analyst' | 'advisory';
  data: any;
  retry_count: number;
  created_at: string;
  timeout_ms: number;
}

export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
  next_stage?: string;
}

export class JobQueue {
  private redis: Redis;
  private readonly QUEUE_PREFIX = 'civicops:queue';
  private readonly RETRY_PREFIX = 'civicops:retry';
  private readonly HEARTBEAT_PREFIX = 'civicops:heartbeat';

  constructor(redisUrl: string = 'redis://localhost:6379', password?: string) {
    this.redis = new Redis(redisUrl, {
      password: password || 'R3d1s!Ops@2025_secure',
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });
  }

  /**
   * Enqueue a job with scenario hash and stage
   */
  async enqueueJob(payload: JobPayload): Promise<string> {
    const jobKey = `${this.QUEUE_PREFIX}:${payload.scenario_hash}:${payload.stage}`;
    const jobId = crypto.randomUUID();
    
    const jobData = {
      ...payload,
      job_id: jobId,
      enqueued_at: new Date().toISOString(),
    };

    try {
      await this.redis.lpush(jobKey, JSON.stringify(jobData));
      console.log(`Job enqueued: ${jobKey} with ID ${jobId}`);
      return jobId;
    } catch (error) {
      console.error('Failed to enqueue job:', error);
      throw new Error(`Queue insertion failed: ${error}`);
    }
  }

  /**
   * Dequeue and process next job for a specific stage
   */
  async dequeueJob(stage: string): Promise<JobPayload | null> {
    const pattern = `${this.QUEUE_PREFIX}:*:${stage}`;
    
    try {
      const keys = await this.redis.keys(pattern);
      
      for (const key of keys) {
        const jobData = await this.redis.rpop(key);
        if (jobData) {
          const job = JSON.parse(jobData) as JobPayload;
          
          // Start heartbeat monitoring
          await this.startHeartbeat(job.scenario_hash, job.stage);
          
          return job;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to dequeue job:', error);
      return null;
    }
  }

  /**
   * Complete a job and optionally enqueue next stage
   */
  async completeJob(
    scenario_hash: string, 
    stage: string, 
    result: JobResult
  ): Promise<void> {
    try {
      // Stop heartbeat
      await this.stopHeartbeat(scenario_hash, stage);
      
      if (result.success && result.next_stage) {
        // Enqueue next stage
        const nextPayload: JobPayload = {
          scenario_hash,
          stage: result.next_stage as any,
          data: result.data,
          retry_count: 0,
          created_at: new Date().toISOString(),
          timeout_ms: 300000, // 5 minutes default
        };
        
        await this.enqueueJob(nextPayload);
      }
      
      console.log(`Job completed: ${scenario_hash}:${stage}, success: ${result.success}`);
    } catch (error) {
      console.error('Failed to complete job:', error);
    }
  }

  /**
   * Retry a failed job with exponential backoff
   */
  async retryJob(payload: JobPayload, error: string): Promise<void> {
    const maxRetries = 3;
    
    if (payload.retry_count >= maxRetries) {
      console.error(`Job failed permanently: ${payload.scenario_hash}:${payload.stage} - ${error}`);
      return;
    }

    const retryPayload: JobPayload = {
      ...payload,
      retry_count: payload.retry_count + 1,
    };

    // Exponential backoff: 2^retry_count seconds
    const delaySeconds = Math.pow(2, payload.retry_count);
    const retryKey = `${this.RETRY_PREFIX}:${payload.scenario_hash}:${payload.stage}`;
    
    try {
      await this.redis.setex(
        retryKey, 
        delaySeconds, 
        JSON.stringify(retryPayload)
      );
      
      console.log(`Job scheduled for retry in ${delaySeconds}s: ${payload.scenario_hash}:${payload.stage}`);
    } catch (error) {
      console.error('Failed to schedule retry:', error);
    }
  }

  /**
   * Process retry queue and re-enqueue expired jobs
   */
  async processRetryQueue(): Promise<void> {
    const pattern = `${this.RETRY_PREFIX}:*`;
    
    try {
      const keys = await this.redis.keys(pattern);
      
      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        
        if (ttl <= 0) {
          const jobData = await this.redis.get(key);
          if (jobData) {
            const payload = JSON.parse(jobData) as JobPayload;
            await this.enqueueJob(payload);
            await this.redis.del(key);
          }
        }
      }
    } catch (error) {
      console.error('Failed to process retry queue:', error);
    }
  }

  /**
   * Start heartbeat monitoring for a job
   */
  private async startHeartbeat(scenario_hash: string, stage: string): Promise<void> {
    const heartbeatKey = `${this.HEARTBEAT_PREFIX}:${scenario_hash}:${stage}`;
    await this.redis.setex(heartbeatKey, 30, new Date().toISOString());
  }

  /**
   * Update heartbeat for active job
   */
  async updateHeartbeat(scenario_hash: string, stage: string): Promise<void> {
    const heartbeatKey = `${this.HEARTBEAT_PREFIX}:${scenario_hash}:${stage}`;
    await this.redis.setex(heartbeatKey, 30, new Date().toISOString());
  }

  /**
   * Stop heartbeat monitoring
   */
  private async stopHeartbeat(scenario_hash: string, stage: string): Promise<void> {
    const heartbeatKey = `${this.HEARTBEAT_PREFIX}:${scenario_hash}:${stage}`;
    await this.redis.del(heartbeatKey);
  }

  /**
   * Check for timed out jobs and handle them
   */
  async checkTimeouts(): Promise<void> {
    const pattern = `${this.HEARTBEAT_PREFIX}:*`;
    
    try {
      const keys = await this.redis.keys(pattern);
      
      for (const key of keys) {
        const ttl = await this.redis.ttl(key);
        
        if (ttl <= 0) {
          // Job timed out
          const parts = key.split(':');
          const scenario_hash = parts[2];
          const stage = parts[3];
          
          console.warn(`Job timed out: ${scenario_hash}:${stage}`);
          
          // Clean up and potentially retry
          await this.redis.del(key);
        }
      }
    } catch (error) {
      console.error('Failed to check timeouts:', error);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<Record<string, number>> {
    const stages = ['recon', 'correlation', 'analyst', 'advisory'];
    const stats: Record<string, number> = {};
    
    for (const stage of stages) {
      const pattern = `${this.QUEUE_PREFIX}:*:${stage}`;
      const keys = await this.redis.keys(pattern);
      
      let totalJobs = 0;
      for (const key of keys) {
        const length = await this.redis.llen(key);
        totalJobs += length;
      }
      
      stats[stage] = totalJobs;
    }
    
    return stats;
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}
