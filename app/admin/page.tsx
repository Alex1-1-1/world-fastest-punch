export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
import { redirect } from 'next/navigation';

export default function AdminPage() {
  // 直接管理者ログイン画面にリダイレクト
  redirect('/admin/signin');
}



