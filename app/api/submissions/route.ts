import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const description = formData.get('description') as string;
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;

    if (!image) {
      return NextResponse.json(
        { error: '画像が選択されていません' },
        { status: 400 }
      );
    }

    // 画像をSupabase Storageにアップロード
    const fileExt = image.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `submissions/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, image);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: '画像のアップロードに失敗しました' },
        { status: 500 }
      );
    }

    // 画像URLを取得
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    // ユーザーを取得または作成
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError && userError.code === 'PGRST116') {
      // ユーザーが存在しない場合は作成
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          email,
          name: name || '匿名ユーザー',
        })
        .select()
        .single();

      if (createUserError) {
        console.error('User creation error:', createUserError);
        return NextResponse.json(
          { error: 'ユーザーの作成に失敗しました' },
          { status: 500 }
        );
      }
      user = newUser;
    } else if (userError) {
      console.error('User fetch error:', userError);
      return NextResponse.json(
        { error: 'ユーザーの取得に失敗しました' },
        { status: 500 }
      );
    }

    // 投稿を作成
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        user_id: user.id,
        image_url: publicUrl,
        description,
        status: 'pending',
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Submission creation error:', submissionError);
      return NextResponse.json(
        { error: '投稿の作成に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error('Submission creation error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');

    // 投稿を取得
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        *,
        users:user_id (
          id,
          name,
          email,
          image_url
        )
      `)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Submissions fetch error:', error);
      return NextResponse.json(
        { error: '投稿の取得に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json(submissions || []);
  } catch (error) {
    console.error('Submissions fetch error:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}