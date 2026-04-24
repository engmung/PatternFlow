'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 클라이언트 사이드에서만 초기화하고, API KEY가 있을 때만 동작하도록 설정
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
        person_profiles: 'identified_only', // 식별된 사용자 프로필만 생성
        capture_pageview: false, // Next.js 환경에 맞게 수동 페이지뷰 캡처 설정(선택사항)
      })
    }
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
