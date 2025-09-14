import { redirect } from 'next/navigation';

export default function AdminPage() {
  // 直接管理者ログイン画面にリダイレクト
  redirect('/admin/signin');
}



