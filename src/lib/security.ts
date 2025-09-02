/**
 * Security utilities for input validation, sanitization, and safety measures
 * Implements requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

// XSS prevention patterns
const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
  /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
  /javascript:/gi,
  /vbscript:/gi,
  /data:text\/html/gi,
  /on\w+\s*=/gi, // Event handlers like onclick, onload, etc.
];

// SQL injection patterns (for additional safety)
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  /(--|\/\*|\*\/|;|'|"|\||&|\+)/g,
];

// Dangerous characters that should be escaped or removed
const DANGEROUS_CHARS = /[<>'"&\x00-\x1f\x7f-\x9f]/g;

/**
 * Sanitizes user input to prevent XSS and injection attacks
 */
export function sanitizeInput(input: string, options: {
  allowHtml?: boolean;
  maxLength?: number;
  removeNewlines?: boolean;
} = {}): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Trim whitespace
  sanitized = sanitized.trim();

  // Apply length limit
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  // Remove newlines if requested
  if (options.removeNewlines) {
    sanitized = sanitized.replace(/[\r\n]/g, ' ');
  }

  // Remove XSS patterns
  XSS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // Remove SQL injection patterns
  SQL_INJECTION_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });

  // If HTML is not allowed, escape dangerous characters
  if (!options.allowHtml) {
    // First escape ampersands to prevent double-escaping
    sanitized = sanitized.replace(/&/g, '&amp;');
    // Then escape other characters
    sanitized = sanitized.replace(/</g, '&lt;');
    sanitized = sanitized.replace(/>/g, '&gt;');
    sanitized = sanitized.replace(/"/g, '&quot;');
    sanitized = sanitized.replace(/'/g, '&#x27;');
    // Remove other dangerous characters
    sanitized = sanitized.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
  }

  return sanitized;
}

/**
 * Validates user name input with security checks
 */
export function validateName(name: string): { isValid: boolean; error?: string; sanitized: string } {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Name is required', sanitized: '' };
  }

  // Check length before sanitization to catch overly long names
  if (name.trim().length > 50) {
    return { isValid: false, error: 'Name must be 50 characters or less', sanitized: name.trim().substring(0, 50) };
  }

  const sanitized = sanitizeInput(name, { maxLength: 50, removeNewlines: true });

  if (!sanitized.trim()) {
    return { isValid: false, error: 'Name is required', sanitized };
  }

  // Allow only alphanumeric characters, spaces, hyphens, underscores, and periods
  if (!/^[a-zA-Z0-9\s\-_.]+$/.test(sanitized)) {
    return { isValid: false, error: 'Name contains invalid characters. Only letters, numbers, spaces, hyphens, underscores, and periods are allowed.', sanitized };
  }

  // Check for suspicious patterns
  if (/^\s*$/.test(sanitized)) {
    return { isValid: false, error: 'Name cannot be empty or contain only spaces', sanitized };
  }

  // Prevent names that look like addresses or hashes
  if (/^0x[a-fA-F0-9]{40}$/.test(sanitized)) {
    return { isValid: false, error: 'Please use a display name, not a wallet address', sanitized };
  }

  return { isValid: true, sanitized };
}

/**
 * Validates message input with security checks
 */
export function validateMessage(message: string): { isValid: boolean; error?: string; sanitized: string } {
  if (!message) {
    return { isValid: true, sanitized: '' }; // Message is optional
  }

  if (typeof message !== 'string') {
    return { isValid: false, error: 'Invalid message format', sanitized: '' };
  }

  // Check length before sanitization to catch overly long messages
  if (message.length > 280) {
    return { isValid: false, error: 'Message must be 280 characters or less', sanitized: message.substring(0, 280) };
  }

  const sanitized = sanitizeInput(message, { maxLength: 280 });

  // Check for spam patterns
  const spamPatterns = [
    /(.)\1{10,}/g, // Repeated characters (more than 10 times)
    /https?:\/\/[^\s]+/gi, // URLs (for spam prevention)
    /\b(buy|sell|invest|crypto|token|coin|nft|airdrop|giveaway|free|win|prize)\b.*\b(now|today|click|link|website)\b/gi,
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(sanitized)) {
      return { isValid: false, error: 'Message appears to contain spam or promotional content', sanitized };
    }
  }

  return { isValid: true, sanitized };
}

/**
 * Validates transaction amount for safety
 */
export function validateTransactionAmount(amount: bigint, selectedSize: string): { isValid: boolean; error?: string } {
  if (typeof amount !== 'bigint') {
    return { isValid: false, error: 'Invalid amount format' };
  }

  if (amount <= 0n) {
    return { isValid: false, error: 'Amount must be greater than zero' };
  }

  // Define expected amounts for each coffee size
  const expectedAmounts = {
    small: BigInt('1000000000000000'),   // 0.001 ETH
    medium: BigInt('3000000000000000'),  // 0.003 ETH
    large: BigInt('5000000000000000'),   // 0.005 ETH
  };

  const expectedAmount = expectedAmounts[selectedSize as keyof typeof expectedAmounts];
  if (!expectedAmount) {
    return { isValid: false, error: 'Invalid coffee size selected' };
  }

  if (amount !== expectedAmount) {
    return { isValid: false, error: 'Transaction amount does not match selected coffee size' };
  }

  // Check for suspiciously large amounts (more than 0.1 ETH) - but only after validating the expected amount
  if (amount === expectedAmount) {
    const maxAmount = BigInt('100000000000000000'); // 0.1 ETH
    if (amount > maxAmount) {
      return { isValid: false, error: 'Amount exceeds maximum allowed limit for safety' };
    }
  }

  return { isValid: true };
}

/**
 * Checks if data contains sensitive information that shouldn't be stored
 */
export function containsSensitiveData(data: any): boolean {
  if (typeof data === 'string') {
    // Check for private keys, mnemonics, passwords
    const sensitivePatterns = [
      /^0x[a-fA-F0-9]{64}$/,  // Private key pattern
      /\b(private\s+key|seed\s+phrase|password\d+|secret\s+token)\b/i,
      /\b([a-z]+\s+){11,23}[a-z]+\b/i, // Mnemonic phrase pattern
    ];

    return sensitivePatterns.some(pattern => pattern.test(data));
  }

  if (typeof data === 'object' && data !== null) {
    return Object.values(data).some(value => containsSensitiveData(value));
  }

  return false;
}

/**
 * Safe storage wrapper that prevents storing sensitive data
 */
export const safeStorage = {
  setItem(key: string, value: any): boolean {
    try {
      if (containsSensitiveData(value)) {
        console.warn('Attempted to store sensitive data - operation blocked');
        return false;
      }

      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error('Failed to store data safely:', error);
      return false;
    }
  },

  getItem(key: string): any {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to retrieve data safely:', error);
      return null;
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove data safely:', error);
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear storage safely:', error);
    }
  }
};

/**
 * Transaction safety confirmation data
 */
export interface TransactionConfirmation {
  recipient: string;
  amount: string;
  coffeeSize: string;
  estimatedGas?: string;
  networkName: string;
  timestamp: number;
}

/**
 * Generates a human-readable transaction confirmation
 */
export function generateTransactionConfirmation(
  amount: bigint,
  coffeeSize: string,
  contractAddress: string,
  networkName: string = 'Arbitrum'
): TransactionConfirmation {
  const ethAmount = (Number(amount) / 1e18).toFixed(6);
  
  return {
    recipient: contractAddress,
    amount: `${ethAmount} ETH`,
    coffeeSize: coffeeSize.charAt(0).toUpperCase() + coffeeSize.slice(1),
    networkName,
    timestamp: Date.now(),
  };
}

/**
 * Rate limiting for transaction attempts
 */
class TransactionRateLimit {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts = 5;
  private readonly windowMs = 60000; // 1 minute

  isAllowed(userAddress: string): boolean {
    const now = Date.now();
    const userAttempts = this.attempts.get(userAddress) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = userAttempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }

    // Record this attempt
    recentAttempts.push(now);
    this.attempts.set(userAddress, recentAttempts);
    
    return true;
  }

  getRemainingTime(userAddress: string): number {
    const userAttempts = this.attempts.get(userAddress) || [];
    if (userAttempts.length === 0) return 0;
    
    const oldestAttempt = Math.min(...userAttempts);
    const remainingTime = this.windowMs - (Date.now() - oldestAttempt);
    
    return Math.max(0, remainingTime);
  }
}

export const transactionRateLimit = new TransactionRateLimit();

/**
 * Security audit log for monitoring suspicious activities
 */
export class SecurityAuditLog {
  private static instance: SecurityAuditLog;
  private logs: Array<{
    timestamp: number;
    event: string;
    severity: 'low' | 'medium' | 'high';
    details: any;
  }> = [];

  static getInstance(): SecurityAuditLog {
    if (!SecurityAuditLog.instance) {
      SecurityAuditLog.instance = new SecurityAuditLog();
    }
    return SecurityAuditLog.instance;
  }

  log(event: string, severity: 'low' | 'medium' | 'high', details: any = {}): void {
    this.logs.push({
      timestamp: Date.now(),
      event,
      severity,
      details,
    });

    // Keep only last 100 logs to prevent memory issues
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }

    // Log high severity events to console
    if (severity === 'high') {
      console.warn('Security Event:', { event, details });
    }
  }

  getLogs(): typeof this.logs {
    return [...this.logs];
  }

  getHighSeverityLogs(): typeof this.logs {
    return this.logs.filter(log => log.severity === 'high');
  }
}

export const securityAuditLog = SecurityAuditLog.getInstance();