/**
 * PortOne V2 결제 — @portone/browser-sdk
 * 식별코드: store-... + 채널 키(channel-key-...)
 * @see https://developers.portone.io/opi/ko/integration/start/v2/checkout
 */

import PortOne, {
  EasyPayProvider,
  PaymentPayMethod,
  isPaymentError,
  type PaymentRequest,
} from '@portone/browser-sdk/v2'

/** V2 결제 성공 응답 (서버·주문 API 호환용 필드 포함) */
export type PortOnePayResponse = {
  success?: boolean
  /** PortOne 거래 ID (txId) */
  txId: string
  /** 고객사 결제 ID (paymentId, 주문 시 merchantUid로 전달) */
  paymentId: string
  /** @deprecated 서버 호환 — txId와 동일 */
  imp_uid?: string
  /** @deprecated 서버 호환 — paymentId와 동일 */
  merchant_uid?: string
}

export const PORTONE_STORE_ID = 'store-39337918-0aa5-4eab-8a01-5a7728538293'

export function getPortOneStoreId(): string {
  const fromEnv = import.meta.env.VITE_PORTONE_STORE_ID?.trim()
  if (!fromEnv || fromEnv.includes('your-store-id')) {
    return PORTONE_STORE_ID
  }
  return fromEnv
}

export function getPortOneChannelKey(): string | undefined {
  const key = import.meta.env.VITE_PORTONE_CHANNEL_KEY?.trim()
  if (!key || key.includes('your-channel-key')) return undefined
  return key
}

function assertV2StoreId(storeId: string): void {
  if (!storeId.startsWith('store-')) {
    throw new Error('결제 설정이 올바르지 않습니다.')
  }
}

let ready = false

/** V2 SDK 준비 (채널 키·store ID 검증) */
export async function initPortOne(storeId = getPortOneStoreId()): Promise<void> {
  const config = validatePortOnePaymentConfig()
  if (!config.ready) {
    throw new Error(config.message ?? '결제 설정이 완료되지 않았습니다.')
  }
  assertV2StoreId(storeId)
  ready = true
}

export function validatePortOnePaymentConfig(): {
  ready: boolean
  message?: string
} {
  const storeId = getPortOneStoreId()
  if (!storeId.startsWith('store-')) {
    return {
      ready: false,
      message: '결제 설정이 올바르지 않습니다. 관리자에게 문의해 주세요.',
    }
  }

  if (!getPortOneChannelKey()) {
    return {
      ready: false,
      message: '결제 설정이 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.',
    }
  }

  return { ready: true }
}

export function isMobilePaymentEnv(): boolean {
  if (typeof window === 'undefined') return false
  return (
    /Android|iPhone|iPad|iPod|Mobile|IEMobile/i.test(navigator.userAgent) ||
    window.matchMedia('(max-width: 768px)').matches
  )
}

export function getPortOnePaymentRedirectUrl(): string {
  const fromEnv = import.meta.env.VITE_PORTONE_REDIRECT_URL?.trim()
  if (fromEnv) return fromEnv
  return `${window.location.origin}/checkout/complete`
}

export type PortOnePayMethod = 'card' | 'trans' | 'kakaopay' | 'naverpay'

export function mapPaymentMethodToPayMethod(
  method: 'card' | 'transfer' | 'kakao' | 'naver' | 'test',
): PortOnePayMethod {
  switch (method) {
    case 'transfer':
      return 'trans'
    case 'kakao':
      return 'kakaopay'
    case 'naver':
      return 'naverpay'
    default:
      return 'card'
  }
}

export function generatePaymentId(): string {
  const suffix =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : String(Date.now()).slice(-8)
  return `payment-${Date.now()}-${suffix}`
}

/** @deprecated generatePaymentId 사용 */
export const generateMerchantUid = generatePaymentId

export type RequestPayBuyer = {
  email?: string
  name: string
  tel: string
  addr?: string
  postcode?: string
}

export type RequestPayOptions = {
  payMethod: PortOnePayMethod
  /** V2 paymentId (고객사 주문번호) */
  paymentId: string
  orderName: string
  amount: number
  buyer: RequestPayBuyer
}

function buildPaymentRequest(options: RequestPayOptions): PaymentRequest {
  const channelKey = getPortOneChannelKey()
  if (!channelKey) {
    throw new Error('결제 설정이 완료되지 않았습니다.')
  }

  const base: PaymentRequest = {
    storeId: getPortOneStoreId(),
    channelKey,
    paymentId: options.paymentId,
    orderName: options.orderName,
    totalAmount: options.amount,
    currency: 'KRW',
    payMethod: PaymentPayMethod.CARD,
    customer: {
      fullName: options.buyer.name,
      phoneNumber: options.buyer.tel,
      email: options.buyer.email,
      zipcode: options.buyer.postcode,
      address: options.buyer.addr
        ? { addressLine1: options.buyer.addr, addressLine2: '' }
        : undefined,
    },
  }

  if (isMobilePaymentEnv()) {
    base.redirectUrl = getPortOnePaymentRedirectUrl()
  }

  switch (options.payMethod) {
    case 'trans':
      base.payMethod = PaymentPayMethod.TRANSFER
      break
    case 'kakaopay':
      base.payMethod = PaymentPayMethod.EASY_PAY
      base.easyPay = { easyPayProvider: EasyPayProvider.KAKAOPAY }
      break
    case 'naverpay':
      base.payMethod = PaymentPayMethod.EASY_PAY
      base.easyPay = { easyPayProvider: EasyPayProvider.NAVERPAY }
      break
    default:
      base.payMethod = PaymentPayMethod.CARD
  }

  return base
}

function normalizeResponse(response: {
  txId: string
  paymentId: string
}): PortOnePayResponse {
  return {
    success: true,
    txId: response.txId,
    paymentId: response.paymentId,
    imp_uid: response.txId,
    merchant_uid: response.paymentId,
  }
}

export async function requestPortOnePay(
  options: RequestPayOptions,
): Promise<PortOnePayResponse> {
  if (!Number.isFinite(options.amount) || options.amount <= 0) {
    throw new Error('결제 금액이 올바르지 않습니다.')
  }
  if (!options.buyer.tel?.trim()) {
    throw new Error('결제를 위해 연락처가 필요합니다.')
  }

  if (!ready) {
    await initPortOne()
  }

  const request = buildPaymentRequest(options)

  try {
    const response = await PortOne.requestPayment(request)

    if (!response) {
      throw new Error('결제가 취소되었습니다.')
    }

    if (response.code) {
      throw new Error(
        response.message?.trim() || `결제에 실패했습니다. (${response.code})`,
      )
    }

    if (!response.txId?.trim() || !response.paymentId?.trim()) {
      throw new Error('결제가 완료되지 않았습니다. 결제 정보를 확인해 주세요.')
    }

    return normalizeResponse(response)
  } catch (err) {
    if (isPaymentError(err)) {
      throw new Error(
        err.pgMessage?.trim() ||
          err.message?.trim() ||
          `결제에 실패했습니다. (${err.code})`,
      )
    }
    throw err
  }
}
