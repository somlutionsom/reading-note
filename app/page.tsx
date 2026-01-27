/**
 * 홈페이지
 * PM/UX: 온보딩 페이지로 바로 리다이렉트
 */

import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/onboarding');
}
