/**
 * Prompt Security Service
 * 
 * Detects and prevents prompt injection attacks, jailbreak attempts,
 * and other malicious prompt patterns.
 * 
 * Based on recommendation R-MOD-07 from BRD/FRD review.
 */

/**
 * Known jailbreak patterns and prompt injection attempts
 */
const JAILBREAK_PATTERNS = [
  // Direct instruction overrides
  /ignore (all )?previous (instructions|prompts|rules)/i,
  /forget (all )?(previous|prior) (instructions|prompts|rules)/i,
  /disregard (all )?(previous|prior) (instructions|prompts|rules)/i,
  
  // Role manipulation
  /you are now/i,
  /act as (a |an )?(?!software engineer|developer|programmer)/i,
  /pretend (you are|to be)/i,
  /simulate (being|a)/i,
  
  // System prompt extraction
  /show (me )?(your |the )?system prompt/i,
  /what (is|are) your (instructions|rules|guidelines)/i,
  /repeat (your |the )?instructions/i,
  /print (your |the )?(system )?prompt/i,
  
  // Delimiter injection
  /```system/i,
  /\[SYSTEM\]/i,
  /<\|system\|>/i,
  /###SYSTEM###/i,
  
  // Harmful content requests
  /write (a )?virus/i,
  /create (a )?malware/i,
  /hack (into|a)/i,
  /exploit (a )?vulnerability/i,
  /bypass security/i,
  
  // Data exfiltration attempts
  /send (this |the )?data to/i,
  /post (this |the )?data to/i,
  /upload (this |the )?data to/i,
  
  // Encoding tricks
  /base64/i,
  /rot13/i,
  /hex encode/i,
  
  // Multi-language tricks
  /translate.*ignore/i,
  /in spanish.*forget/i,
];

/**
 * Suspicious patterns that warrant logging but not blocking
 */
const SUSPICIOUS_PATTERNS = [
  /delete (all |every)?file/i,
  /remove (all |every)?file/i,
  /drop (all |every)?table/i,
  /truncate table/i,
  /rm -rf/i,
  /format (c:|hard drive)/i,
];

/**
 * Check if prompt contains jailbreak attempts
 */
export function detectJailbreak(prompt: string): {
  isJailbreak: boolean;
  matchedPattern?: string;
  severity: "none" | "low" | "medium" | "high";
} {
  // Check for jailbreak patterns
  for (const pattern of JAILBREAK_PATTERNS) {
    if (pattern.test(prompt)) {
      return {
        isJailbreak: true,
        matchedPattern: pattern.source,
        severity: "high",
      };
    }
  }

  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(prompt)) {
      return {
        isJailbreak: false,
        matchedPattern: pattern.source,
        severity: "medium",
      };
    }
  }

  return {
    isJailbreak: false,
    severity: "none",
  };
}

/**
 * Sanitize user input to prevent injection
 */
export function sanitizePrompt(prompt: string): string {
  // Remove potential delimiter injections
  let sanitized = prompt
    .replace(/```system/gi, "```text")
    .replace(/\[SYSTEM\]/gi, "[USER]")
    .replace(/<\|system\|>/gi, "<|user|>")
    .replace(/###SYSTEM###/gi, "###USER###");

  // Limit excessive repetition (potential token exhaustion attack)
  sanitized = sanitized.replace(/(.{10,}?)\1{5,}/g, "$1$1$1");

  // Limit total length (prevent token exhaustion)
  const MAX_PROMPT_LENGTH = 10000;
  if (sanitized.length > MAX_PROMPT_LENGTH) {
    sanitized = sanitized.substring(0, MAX_PROMPT_LENGTH);
  }

  return sanitized;
}

/**
 * Validate and sanitize code modification request
 */
export function validateCodeModificationRequest(request: string): {
  isValid: boolean;
  sanitized: string;
  reason?: string;
} {
  // Detect jailbreak
  const jailbreakCheck = detectJailbreak(request);
  
  if (jailbreakCheck.isJailbreak) {
    return {
      isValid: false,
      sanitized: "",
      reason: "Potential prompt injection detected. Please rephrase your request.",
    };
  }

  // Sanitize the prompt
  const sanitized = sanitizePrompt(request);

  // Check minimum length (prevent empty or trivial requests)
  if (sanitized.trim().length < 10) {
    return {
      isValid: false,
      sanitized: "",
      reason: "Request too short. Please provide more details about the changes you want.",
    };
  }

  // Log suspicious patterns for monitoring
  if (jailbreakCheck.severity === "medium") {
    console.warn("[PromptSecurity] Suspicious pattern detected:", {
      pattern: jailbreakCheck.matchedPattern,
      request: sanitized.substring(0, 100),
    });
  }

  return {
    isValid: true,
    sanitized,
  };
}

/**
 * Log security events for admin review
 */
export async function logSecurityEvent(event: {
  userId: number;
  eventType: "jailbreak_attempt" | "suspicious_pattern" | "rate_limit_exceeded";
  severity: "low" | "medium" | "high";
  details: string;
  prompt?: string;
}): Promise<void> {
  // In production, this would log to a security monitoring system
  console.warn("[Security Event]", {
    timestamp: new Date().toISOString(),
    ...event,
    prompt: event.prompt?.substring(0, 200), // Truncate for logging
  });

  // TODO: Store in database for admin dashboard
  // TODO: Send alert for high-severity events
  // TODO: Implement automatic user suspension for repeated violations
}

/**
 * Check if feature is enabled (kill switch)
 */
export function isFeatureEnabled(feature: "code_modification" | "codebase_analysis"): boolean {
  // Check environment variable for kill switch
  const killSwitch = process.env[`DISABLE_${feature.toUpperCase()}`];
  
  if (killSwitch === "true" || killSwitch === "1") {
    console.warn(`[KillSwitch] Feature ${feature} is disabled`);
    return false;
  }

  return true;
}

/**
 * Rate limit configuration per feature
 */
export const RATE_LIMITS = {
  code_modification: {
    perHour: 10,
    perDay: 50,
    message: "You've reached the hourly limit for code modifications. Please try again later.",
  },
  codebase_analysis: {
    perHour: 20,
    perDay: 100,
    message: "You've reached the hourly limit for codebase analysis. Please try again later.",
  },
  code_generation: {
    perHour: 15,
    perDay: 75,
    message: "You've reached the hourly limit for code generation. Please try again later.",
  },
} as const;
