import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '管理者ログイン - 世界一速いパンチ',
  description: '管理者権限でログインしてダッシュボードにアクセス',
};

export default function AdminSignInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
