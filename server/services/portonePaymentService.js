/**
 * PortOne(아임포트) REST API — 결제 단건 조회로 위변조 검증
 * @see https://developers.portone.io/opi/ko/integration/start/v1/auth
 */

const IAMPORT_TOKEN_URL = "https://api.iamport.kr/users/getToken";
const IAMPORT_PAYMENT_URL = "https://api.iamport.kr/payments";

let cachedAccessToken = null;
let tokenExpiresAt = 0;

function getCredentials() {
  const impKey = process.env.PORTONE_IMP_KEY?.trim();
  const impSecret = process.env.PORTONE_IMP_SECRET?.trim();
  return { impKey, impSecret };
}

function assertPaymentConfigured() {
  const { impKey, impSecret } = getCredentials();
  if (!impKey || !impSecret) {
    const err = new Error(
      "PortOne API credentials are not configured. Set PORTONE_IMP_KEY and PORTONE_IMP_SECRET in server .env."
    );
    err.statusCode = 503;
    throw err;
  }
  return { impKey, impSecret };
}

async function fetchAccessToken() {
  const now = Date.now();
  if (cachedAccessToken && tokenExpiresAt > now + 30_000) {
    return cachedAccessToken;
  }

  const { impKey, impSecret } = assertPaymentConfigured();
  const res = await fetch(IAMPORT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imp_key: impKey, imp_secret: impSecret }),
  });

  const data = await res.json();
  if (!res.ok || data.code !== 0 || !data.response?.access_token) {
    const err = new Error(data.message ?? "Failed to obtain PortOne access token");
    err.statusCode = 502;
    throw err;
  }

  cachedAccessToken = data.response.access_token;
  const expiresIn = Number(data.response.expired_at ?? 0);
  tokenExpiresAt = expiresIn > 1_000_000_000_000 ? expiresIn : now + 30 * 60 * 1000;
  return cachedAccessToken;
}

/**
 * @param {string} impUid
 * @returns {Promise<Record<string, unknown>>}
 */
export async function fetchPaymentByImpUid(impUid) {
  const token = await fetchAccessToken();
  const res = await fetch(`${IAMPORT_PAYMENT_URL}/${encodeURIComponent(impUid)}`, {
    headers: { Authorization: token },
  });

  const data = await res.json();
  if (!res.ok || data.code !== 0 || !data.response) {
    const err = new Error(data.message ?? "Failed to fetch payment from PortOne");
    err.statusCode = 502;
    throw err;
  }

  return data.response;
}

/**
 * V2 paymentId(merchant_uid)로 결제 조회
 * @param {string} merchantUid
 * @returns {Promise<Record<string, unknown>>}
 */
export async function fetchPaymentByMerchantUid(merchantUid) {
  const token = await fetchAccessToken();
  const res = await fetch(
    `${IAMPORT_PAYMENT_URL}/find/${encodeURIComponent(merchantUid)}`,
    { headers: { Authorization: token } },
  );

  const data = await res.json();
  if (!res.ok || data.code !== 0 || !data.response) {
    const err = new Error(data.message ?? "Failed to find payment by merchant_uid");
    err.statusCode = 502;
    throw err;
  }

  return data.response;
}

/**
 * @param {{
 *   impUid: string;
 *   expectedAmount: number;
 *   merchantUid?: string;
 * }} input
 */
async function resolvePaymentRecord({ impUid, merchantUid }) {
  const uid = impUid?.trim();
  const merchant = merchantUid?.trim();

  if (uid?.startsWith("imp_")) {
    return fetchPaymentByImpUid(uid);
  }

  if (merchant) {
    try {
      return await fetchPaymentByMerchantUid(merchant);
    } catch (merchantErr) {
      if (uid) {
        return fetchPaymentByImpUid(uid);
      }
      throw merchantErr;
    }
  }

  if (uid) {
    return fetchPaymentByImpUid(uid);
  }

  const err = new Error("Payment id (imp_uid or merchant_uid) is required");
  err.statusCode = 400;
  throw err;
}

export async function verifyPortOnePayment({ impUid, expectedAmount, merchantUid }) {
  const payment = await resolvePaymentRecord({ impUid, merchantUid });

  const status = String(payment.status ?? "");
  if (status !== "paid") {
    const err = new Error(`Payment is not completed. Current status: ${status || "unknown"}`);
    err.statusCode = 402;
    throw err;
  }

  const paidAmount = Number(payment.amount);
  if (!Number.isFinite(paidAmount) || paidAmount !== expectedAmount) {
    const err = new Error(
      `Payment amount mismatch. Expected ${expectedAmount}, got ${paidAmount}`
    );
    err.statusCode = 402;
    throw err;
  }

  if (merchantUid) {
    const paidMerchantUid = String(payment.merchant_uid ?? "").trim();
    if (paidMerchantUid && paidMerchantUid !== merchantUid) {
      const err = new Error("merchant_uid does not match the payment record");
      err.statusCode = 402;
      throw err;
    }
  }

  return payment;
}
