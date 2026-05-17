// Domain Reconnaissance Module - WHOIS, DNS, Subdomains, SSL
import { httpClient } from '../core/http-client';
import { Target, Finding, EvidenceLink } from '../types';
import { significanceEngine } from '../core/significance';

interface WhoisRecord {
  registrar?: string;
  registered?: boolean;
  createdDate?: string;
  expiryDate?: string;
  nameServers?: string[];
}

interface DnsRecord {
  type: 'A' | 'MX' | 'NS' | 'TXT' | 'AAAA';
  value: string;
  ttl?: number;
}

interface Subdomain {
  name: string;
  discoveredAt: Date;
}

export class DomainRecon {
  private target: Target;
  private findings: Finding[] = [];

  constructor(target: Target) {
    this.target = target;
  }

  async run(): Promise<Finding[]> {
    // Run all checks in parallel where possible
    const [whois, dns, subdomains] = await Promise.all([
      this.getWhois(),
      this.getDns(),
      this.getSubdomains(),
    ]);

    // Add findings for each result type
    for (const finding of whois) this.findings.push(finding);
    for (const finding of dns) this.findings.push(finding);
    for (const finding of subdomains) this.findings.push(finding);

    return this.findings;
  }

  private async getWhois(): Promise<Finding[]> {
    const findings: Finding[] = [];
    const domain = this.target.value;

    try {
      // Use RDAP (Registration Data Access Protocol) - modern replacement for WHOIS
      const rdapUrl = `https://rdap.org/domain/${domain}`;
      const rdapData = await httpClient.get<any>(rdapUrl, undefined, false);

      if (rdapData) {
        const evidence: EvidenceLink = {
          id: `ev-whois-${Date.now()}`,
          source: 'rdap',
          sourceType: 'api',
          data: JSON.stringify({
            registrar: rdapData.remark?.[0] || rdapData.clir?.registrar,
            status: rdapData.status,
            nameservers: rdapData.nameservers?.map((ns: any) => ns.ldh || ns.title) || [],
          }),
          reliability: 0.95,
          collectedAt: new Date(),
          verified: true,
        };

        findings.push({
          id: `find-whois-${Date.now()}`,
          target: this.target,
          type: 'infrastructure',
          value: domain,
          source: 'rdap',
          sourceUrl: rdapUrl,
          significance: significanceEngine.calculateSignificance(
            { source: 'rdap', type: 'infrastructure' },
            { overallFindingCount: 0 }
          ),
          evidence: [evidence],
          collectedAt: new Date(),
        });
      }
    } catch (error) {
      console.error(`WHOIS lookup failed for ${domain}:`, error);
    }

    return findings;
  }

  private async getDns(): Promise<Finding[]> {
    const findings: Finding[] = [];
    const domain = this.target.value;

    const recordTypes: DnsRecord['type'][] = ['A', 'MX', 'NS', 'TXT'];

    for (const type of recordTypes) {
      try {
        // Use DNS-over-HTTPS (Cloudflare or Google)
        const dnsUrl = `https://cloudflare-dns.com/dns-query`;
        const params = { name: domain, type };

        const response = await httpClient.get<any>(dnsUrl, params, true);

        if (response.Answer) {
          for (const record of response.Answer) {
            const evidence: EvidenceLink = {
              id: `ev-dns-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              source: 'cloudflare-dns',
              sourceType: 'api',
              data: `${type}: ${record.data}`,
              reliability: 0.9,
              collectedAt: new Date(),
              verified: true,
            };

            findings.push({
              id: `find-dns-${type}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              target: this.target,
              type: 'infrastructure',
              value: `${type}: ${record.data}`,
              source: 'dns',
              sourceUrl: `https://dns.google/query?name=${domain}&type=${type}`,
              significance: significanceEngine.calculateSignificance(
                { source: 'dns', type: 'infrastructure' },
                { overallFindingCount: findings.length }
              ),
              evidence: [evidence],
              collectedAt: new Date(),
            });
          }
        }
      } catch (error) {
        console.error(`DNS ${type} lookup failed for ${domain}:`, error);
      }
    }

    return findings;
  }

  private async getSubdomains(): Promise<Finding[]> {
    const findings: Finding[] = [];
    const domain = this.target.value;

    try {
      // Use crt.sh for certificate transparency logs
      const crtUrl = `https://crt.sh/?q=%.${domain}&output=json`;
      const certs = await httpClient.get<any[]>(crtUrl, undefined, true);

      if (certs && certs.length > 0) {
        // Deduplicate by subdomain name
        const seen = new Set<string>();

        for (const cert of certs.slice(0, 50)) {
          const name = cert.name_value || cert.common_name;
          if (!name || seen.has(name)) continue;

          // Filter to only subdomains of the target domain
          if (!name.endsWith(`.${domain}`) && name !== domain) continue;

          seen.add(name);

          const evidence: EvidenceLink = {
            id: `ev-sub-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            source: 'crt.sh',
            sourceType: 'api',
            data: `Certificate found for ${name}`,
            reliability: 0.8,
            collectedAt: new Date(),
            verified: false,
          };

          findings.push({
            id: `find-sub-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            target: this.target,
            type: 'infrastructure',
            value: name,
            source: 'crt.sh',
            sourceUrl: `https://crt.sh/?q=${encodeURIComponent(name)}`,
            significance: significanceEngine.calculateSignificance(
              { source: 'crt_sh', type: 'infrastructure' },
              { overallFindingCount: seen.size }
            ),
            evidence: [evidence],
            collectedAt: new Date(),
          });
        }
      }
    } catch (error) {
      console.error(`Subdomain enumeration failed for ${domain}:`, error);
    }

    return findings;
  }

  getFindings(): Finding[] {
    return this.findings;
  }
}

export function createDomainRecon(target: Target): DomainRecon {
  return new DomainRecon(target);
}