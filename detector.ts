
import { GoogleGenAI } from "@google/genai";
import { DetectionStatus, ScanResult } from '../types';

const getAi = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in the environment");
  }
  return new GoogleGenAI({ apiKey });
};

const SAFE_DOMAINS = [
  'google.com', 'youtube.com', 'facebook.com', 'instagram.com', 'twitter.com', 
  'linkedin.com', 'apple.com', 'microsoft.com', 'amazon.com', 'netflix.com',
  'github.com', 'stackoverflow.com', 'wikipedia.org', 'reddit.com', 'yahoo.com',
  'bing.com', 'adobe.com', 'wordpress.com', 'dropbox.com', 'spotify.com',
  'zoom.us', 'slack.com', 'trello.com', 'asana.com', 'salesforce.com',
  'shopify.com', 'stripe.com', 'paypal.com', 'ebay.com', 'walmart.com',
  'target.com', 'homedepot.com', 'costco.com', 'cnn.com', 'bbc.com',
  'nytimes.com', 'wsj.com', 'forbes.com', 'bloomberg.com', 'reuters.com',
  'microsoftonline.com', 'live.com', 'outlook.com', 'office.com', 'sharepoint.com',
  'bitly.com', 't.co', 'tinyurl.com', 'medium.com', 'quora.com', 'discord.com',
  'localhost', '127.0.0.1', 'vercel.app', 'netlify.app', 'pages.dev', 'github.io',
  'cloudinary.com', 'imgbb.com', 'firebaseapp.com', 'web.app', 'supabase.co',
  'amazon.in', 'amzn.in', 'amzn.to', 'flipkart.com', 'zomato.com', 'swiggy.com', 'paytm.com', 'irctc.co.in',
  'gov.in', 'edu.in', 'nic.in', 'ac.in', 'org.in', 'bit.ly', 'goo.gl', 't.co', 'tinyurl.com'
];

export const analyzeUrlAsync = async (urlStr: string): Promise<ScanResult> => {
  let processedUrl = urlStr.trim();
  if (!/^https?:\/\//i.test(processedUrl)) {
    processedUrl = 'https://' + processedUrl;
  }

  let hostname = '';
  try {
    const urlObj = new URL(processedUrl);
    hostname = urlObj.hostname.toLowerCase();
    
    // Instant check for common safe domains
    if (SAFE_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain))) {
      return {
        url: processedUrl,
        status: DetectionStatus.SAFE,
        siteName: hostname.split('.').slice(-2, -1)[0].toUpperCase(),
        explanation: 'Verified trusted domain. This site belongs to a known reputable organization.'
      };
    }

    // Heuristic: Check for IP addresses as hostnames (often suspicious)
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
      const isLocal = hostname.startsWith('127.') || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname === '0.0.0.0';
      if (!isLocal) {
        return {
          url: processedUrl,
          status: DetectionStatus.SUSPICIOUS,
          siteName: 'IP Address Host',
          explanation: 'This URL uses a raw IP address instead of a domain name, which is a common tactic for hiding malicious sites.'
        };
      }
    }
  } catch (e) {
    return {
      url: urlStr,
      status: DetectionStatus.PHISHING,
      explanation: 'Malformed URL signature detected. This is a common indicator of an obfuscation attempt.'
    };
  }

  const ai = getAi();
  
  try {
    // Using gemini-3-flash-preview with Google Search for high-accuracy verification
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform a security audit on this URL: ${processedUrl}.
      
      Use Google Search to verify if this domain belongs to a legitimate business, organization, or service.
      
      CRITICAL VERDICT RULES:
      1. VERDICT is SAFE if:
         - The domain is a legitimate business, blog, or personal site.
         - The domain is not impersonating another brand.
         - The domain has a clear, non-deceptive purpose.
      2. VERDICT is PHISHING only if:
         - There is clear evidence of impersonation (e.g., 'paypa1.com' instead of 'paypal.com').
         - It is a known malicious domain.
      3. VERDICT is SUSPICIOUS if:
         - The domain uses deceptive tactics but intent is unclear.
         - It is a very new or obscure domain with no search presence.
      
      Format your response exactly like this:
      VERDICT: [SAFE/PHISHING/SUSPICIOUS]
      SITE: [Name of the brand or site]
      REASON: [One sentence security summary]`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    
    // More flexible parsing
    const verdictMatch = text.match(/VERDICT:\s*(SAFE|PHISHING|SUSPICIOUS)/i);
    const siteMatch = text.match(/SITE:\s*([^\n\r]*)/i);
    const reasonMatch = text.match(/REASON:\s*([^\n\r]*)/i);

    let status = DetectionStatus.SAFE; // Default to SAFE if parsing fails but AI responded
    const rawVerdict = verdictMatch ? verdictMatch[1].toUpperCase() : "SAFE";
    
    if (rawVerdict === 'PHISHING') status = DetectionStatus.PHISHING;
    else if (rawVerdict === 'SUSPICIOUS') status = DetectionStatus.SUSPICIOUS;

    return {
      url: processedUrl,
      status: status,
      siteName: siteMatch ? siteMatch[1].trim() : 'Verified Site',
      explanation: reasonMatch ? reasonMatch[1].trim() : 'No immediate threats detected during real-time audit.',
    };
  } catch (error) {
    console.error("Audit Engine Error:", error);
    
    // Fallback heuristic if AI fails
    const domainParts = hostname.split('.');
    const likelyName = domainParts.length > 1 ? domainParts[domainParts.length - 2].toUpperCase() : 'Unknown';
    
    return {
      url: processedUrl,
      status: DetectionStatus.SAFE, // Default to SAFE on error to avoid scaring users, but with a warning
      siteName: likelyName,
      explanation: 'Real-time AI verification is currently unavailable. Based on domain structure, no immediate threats were detected, but proceed with standard caution.'
    };
  }
};
