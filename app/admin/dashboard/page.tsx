'use client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ローカルストレージから管理者情報を取得
    const storedAdminUser = localStorage.getItem('admin_user');
    
    if (storedAdminUser) {
      try {
        const adminData = JSON.parse(storedAdminUser);
        // 管理者権限をチェック
        if (adminData.is_staff || adminData.is_superuser) {
          setAdminUser(adminData);
        } else {
          // 管理者権限がない場合はサインインページにリダイレクト
          router.replace('/admin/signin');
        }
      } catch (error) {
        console.error('Error parsing admin user data:', error);
        router.replace('/admin/signin');
      }
    } else {
      // 管理者情報がない場合はサインインページにリダイレクト
      router.replace('/admin/signin');
    }
    
    setIsLoading(false);
  }, [router]);

  // ローディング中はローディング表示
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">管理者権限を確認中...</p>
        </div>
      </div>
    );
  }

  // 管理者情報がない場合は何も表示しない（リダイレクト中）
  if (!adminUser) {
    return null;
  }

  return <AdminDashboard adminUser={adminUser} />;
}
