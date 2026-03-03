import { ethers } from 'ethers';
import fetch from 'node-fetch';
import {
  AgentConfig,
  Capability,
  X402CallOptions,
  X402Response,
  BuildAgentRequest,
  BuildAgentResponse,
  PaymentResult
} from './types';

export class X402Client {
  private config: Required<AgentConfig>;
  private wallet?: ethers.Wallet;

  constructor(config: AgentConfig) {
    this.config = {
      walletAddress: config.walletAddress,
      privateKey: config.privateKey || '',
      baseUrl: config.baseUrl || 'https://agent-bazaar.com'
    };

    if (config.privateKey) {
      this.wallet = new ethers.Wallet(config.privateKey);
    }
  }

  /**
   * Discover available skills with optional filters
   */
  async discover(query?: string): Promise<Capability[]> {
    try {
      const url = new URL('/api/capabilities', this.config.baseUrl);
      if (query) {
        url.searchParams.set('search', query);
      }

      const response = await fetch(url.toString());
      const data = await response.json() as any;

      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }

      throw new Error(data.error || 'Failed to fetch capabilities');
    } catch (error) {
      throw new Error(`Discovery failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Call an x402-enabled skill
   */
  async call<T = any>(
    slug: string, 
    payload: Record<string, any>, 
    options?: X402CallOptions
  ): Promise<X402Response<T>> {
    try {
      const endpoint = `${this.config.baseUrl}/api/x402/${slug}`;
      
      // Use provided payment token or demo
      const paymentToken = options?.paymentToken || 'demo';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-402-Payment': paymentToken,
          'User-Agent': '@agentbazaar/x402-sdk/0.1.0'
        },
        body: JSON.stringify(payload),
        ...(options?.timeout && { timeout: options.timeout })
      });

      const result = await response.json() as any;
      
      if (response.status === 402) {
        // Payment required - return payment info
        return {
          success: false,
          error: 'Payment required',
          data: result.payment
        };
      }

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return {
        success: true,
        data: result,
        metadata: result.metadata
      };
    } catch (error) {
      if (options?.retries && options.retries > 0) {
        // Retry with reduced count
        return this.call(slug, payload, { ...options, retries: options.retries - 1 });
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Build an AI agent configuration
   */
  async build(description: string, options?: { name?: string; platforms?: string[] }): Promise<BuildAgentResponse> {
    const request: BuildAgentRequest = {
      description,
      name: options?.name,
      platforms: options?.platforms
    };

    const response = await this.call<BuildAgentResponse>('agent-builder', request);
    
    if (!response.success) {
      throw new Error(response.error || 'Agent building failed');
    }

    return response.data!;
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(txHash: string, capabilityId: string): Promise<PaymentResult> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/x402/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          txHash,
          capabilityId
        })
      });

      const result = await response.json() as any;
      
      if (!response.ok) {
        throw new Error(result.error || 'Verification failed');
      }

      return {
        txHash: result.txHash,
        verified: result.verified,
        amount: result.amount,
        token: result.token,
        network: result.network,
        timestamp: result.timestamp
      };
    } catch (error) {
      throw new Error(`Payment verification failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Pay for a capability and call it
   */
  async payAndCall<T = any>(
    slug: string,
    payload: Record<string, any>,
    paymentAmount: number
  ): Promise<X402Response<T>> {
    if (!this.wallet) {
      throw new Error('Private key required for payAndCall. Use call() with payment token for manual payments.');
    }

    // First, get payment requirements
    const paymentInfo = await this.call(slug, payload);
    
    if (paymentInfo.success) {
      // Already paid or free
      return paymentInfo;
    }

    if (!paymentInfo.data) {
      throw new Error('No payment information received');
    }

    // TODO: Implement actual payment transaction
    // This would require contract integration
    const mockTxHash = `0x${'1'.repeat(64)}`;
    
    // Call with payment proof
    return this.call<T>(slug, payload, { paymentToken: mockTxHash });
  }

  /**
   * Get client configuration
   */
  getConfig(): Omit<Required<AgentConfig>, 'privateKey'> {
    return {
      walletAddress: this.config.walletAddress,
      baseUrl: this.config.baseUrl
    };
  }
}