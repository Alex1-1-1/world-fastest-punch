'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // セッション読み込み中は何もしない

    if (!session) {
      // ログインしていない場合は管理者専用サインインページにリダイレクト
      router.replace('/admin/signin');
      return;
    }

    // 管理者権限をチェック
    const userRole = (session.user as any)?.role;
    if (userRole !== 'ADMIN') {
      // 管理者権限がない場合はホームページにリダイレクト
      router.replace('/');
      return;
    }
  }, [session, status, router]);

  // リダイレクト中はローディング表示
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">管理者権限を確認中...</p>
        </div>
      </div>
    );
  }

  // セッションがない場合や管理者権限がない場合は何も表示しない（リダイレクト中）
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return null;
  }

  return <AdminDashboard session={session} />;
}
