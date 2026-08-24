export interface SecurityScanResult {
  isSafe: boolean;
  threatCategory?: 'prompt_injection' | 'data_exfiltration' | 'privilege_escalation' | 'malicious_payload' | 'clean';
  confidenceScore: number; // 0 - 100
  sanitizedInput: string;
  reasons: string[];
}

// `[\s+]+` (not `\s+`) — a URL query string joins words with literal "+"
// characters (e.g. "?q=ignore+all+previous+instructions"), which is not
// whitespace and would otherwise slip straight past these patterns. This
// was a real, live-confirmed detection bypass, not a hypothetical: a
// user's goal text containing exactly that URL scanned as "clean" until
// this fix.
const SUSPICIOUS_PATTERNS = [
  /ignore[\s+]+all[\s+]+previous[\s+]+instructions/i,
  /ignore[\s+]+prior[\s+]+system[\s+]+prompts/i,
  /reveal[\s+]+system[\s+]+instructions/i,
  /exfiltrate[\s+]+user[\s+]+data/i,
  /bypass[\s+]+approval[\s+]+gate/i,
  /<script.*?>.*?<\/script>/i,
  /eval\(.*?\)/i,
  /override[\s+]+spend[\s+]+limit/i,
  /transfer[\s+]+funds[\s+]+without[\s+]+approval/i
];

// Best-effort percent-decode so a %69gnore-style or query-string-encoded
// payload is inspected in its actual decoded form, not its encoded
// disguise. Falls back to the raw string on a malformed sequence rather
// than throwing.
function decodeForInspection(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
}

export class ModelArmorGateway {
  /**
   * Scans dynamic external input (e.g. web search outputs, external API responses)
   * before presenting to the LLM agent prompt context.
   */
  public static inspectInput(input: string): SecurityScanResult {
    const reasons: string[] = [];
    let isSafe = true;
    let threatCategory: SecurityScanResult['threatCategory'] = 'clean';
    let confidenceScore = 100;

    // Match against the percent-decoded text so URL-encoded evasion
    // doesn't help either — the [\s+]+ patterns alone only cover the "+"
    // form, not "%20" or nested %-encoding.
    const decoded = decodeForInspection(input);

    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(input) || pattern.test(decoded)) {
        isSafe = false;
        confidenceScore -= 45;
        reasons.push(`Model Armor Shield Triggered: Input matched known injection vector (${pattern.source})`);

        if (/override|bypass|ignore/i.test(pattern.source)) {
          threatCategory = 'prompt_injection';
        } else if (/exfiltrate|reveal/i.test(pattern.source)) {
          threatCategory = 'data_exfiltration';
        } else {
          threatCategory = 'malicious_payload';
        }
      }
    }

    // Sanitize input if injection detected
    let sanitized = input;
    if (!isSafe) {
      sanitized = input
        .replace(/ignore[\s+]+all[\s+]+previous[\s+]+instructions/gi, '[FILTERED_INJECTION]')
        .replace(/override[\s+]+spend[\s+]+limit/gi, '[FILTERED_VIOLATION]')
        .replace(/<script.*?>.*?<\/script>/gi, '[FILTERED_SCRIPT]');
    }

    return {
      isSafe,
      threatCategory,
      confidenceScore: Math.max(0, confidenceScore),
      sanitizedInput: sanitized,
      reasons: reasons.length > 0 ? reasons : ['Model Armor Inspection Passed: Input clean and validated']
    };
  }
}
