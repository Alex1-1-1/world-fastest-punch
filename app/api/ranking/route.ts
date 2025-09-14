import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'speed';
    const week = searchParams.get('week');
    const year = searchParams.get('year');

    // 現在の週を取得
    const now = new Date();
    const currentWeek = week ? parseInt(week) : getWeekNumber(now);
    const currentYear = year ? parseInt(year) : now.getFullYear();

    // ランキングを取得
    const { data: rankings, error } = await supabase
      .from('rankings')
      .select(`
        *,
        submissions:submission_id (
          *,
          users:user_id (
            id,
            name,
            email,
            image_url
          )
        )
      `)
      .eq('category', category)
      .eq('week', currentWeek)
      .eq('year', currentYear)
      .order('position', { ascending: true });

    if (error) {
      console.error('Rankings fetch error:', error);
      return NextResponse.json(
        { error: 'ランキングの取得に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json(rankings || []);
  } catch (error) {
    console.error('Rankings fetch error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

function getWeekNumber(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + start.getDay() + 1) / 7);
}