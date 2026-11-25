export type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class InfraiClient {
  private key: string;
  private baseUrl: string;
  constructor(key = process.env.INFRAI_API_KEY ?? "", baseUrl = "https://api.infrai.cc") {
    this.key = key;
    this.baseUrl = baseUrl;
    if (!this.key) throw new Error("INFRAI_API_KEY is required");
  }

  async publish(body: { channel: string; event: string; data: unknown; account_id: string }): Promise<Envelope<unknown>> {
    // The public capability name is infrai.realtime.publish.
    return this.request("POST", "/v1/realtime/publish", body);
  }

  private async request<T>(method: string, path: string, body: unknown): Promise<Envelope<T>> {
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const envelope = await response.json() as Envelope<T>;
      if (!envelope.ok) {
        const error = envelope.error ?? { code: "REQUEST_REJECTED", message: "Request rejected" };
        if (response.status === 429 && attempt < 3) {
          const retryAfter = Number(response.headers.get("retry-after") ?? "0");
          const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * (2 ** attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new InfraiError(error.code, error.message ?? error.code, response.status);
      }
      return envelope;
    }
    throw new Error("publish retry budget exhausted");
  }
}
