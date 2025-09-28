import SwiftUI

struct SplashView: View {
    @State private var isAnimating = false
    @State private var pulseScale: CGFloat = 1.0
    @State private var titleOpacity: Double = 0.0
    @State private var loadingOpacity: Double = 0.0
    @State private var textOpacity: Double = 0.3  // 初期値を30%に設定
    @State private var gradientOffset: Double = 0.0
    
    let onComplete: () -> Void
    
    var body: some View {
        ZStack {
            // 薄いピンクから薄めの黄色へのグラデーション背景
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 1.0, green: 0.95, blue: 0.95), // 非常に薄いピンク
                    Color(red: 1.0, green: 0.9, blue: 0.85),   // 薄いピンク
                    Color(red: 1.0, green: 0.9, blue: 0.8),     // ピンクから黄色へ
                    Color(red: 1.0, green: 0.95, blue: 0.7)    // 薄めの黄色
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 50) {
                Spacer()
                Spacer()
                
                // メインロゴ部分（WEBアプリ版と同じレイアウト）
                VStack(spacing: 40) {
                    // トロフィーと稲妻のアイコン
                    ZStack {
                        // トロフィー
                        Image(systemName: "trophy")
                            .font(.system(size: 80, weight: .bold))
                            .foregroundStyle(
                                LinearGradient(
                                    gradient: Gradient(colors: [
                                        Color(red: 1.0, green: 0.4, blue: 0.0),  // オレンジ
                                        Color(red: 0.9, green: 0.3, blue: 0.0)    // 濃いオレンジ
                                    ]),
                                    startPoint: UnitPoint(x: gradientOffset, y: 0),
                                    endPoint: UnitPoint(x: gradientOffset + 1, y: 1)
                                )
                            )
                            .scaleEffect(pulseScale)
                            .animation(
                                Animation.easeInOut(duration: 1.5)
                                    .repeatForever(autoreverses: true),
                                value: pulseScale
                            )
                        
                        // 稲妻（トロフィーの右上）
                        Image(systemName: "bolt")
                            .font(.system(size: 25, weight: .bold))
                            .foregroundColor(.yellow)
                            .offset(x: 25, y: -25)
                            .scaleEffect(pulseScale * 1.2)
                            .animation(
                                Animation.easeInOut(duration: 1.5)
                                    .repeatForever(autoreverses: true),
                                value: pulseScale
                            )
                    }
                    
                    // タイトル（WEBアプリ版と同じテキスト）
                    VStack(spacing: 12) {
                        Text("世界一速いパンチ")
                            .font(.system(size: 32, weight: .bold))
                            .foregroundStyle(
                                LinearGradient(
                                    gradient: Gradient(colors: [
                                        Color(red: 1.0, green: 0.2, blue: 0.1),  // 鮮やかな赤
                                        Color(red: 1.0, green: 0.5, blue: 0.0),   // 鮮やかなオレンジ
                                        Color(red: 0.9, green: 0.3, blue: 0.0)    // 濃いオレンジ
                                    ]),
                                    startPoint: UnitPoint(x: gradientOffset, y: 0),
                                    endPoint: UnitPoint(x: gradientOffset + 1, y: 1)
                                )
                            )
                            .shadow(color: Color(red: 0.6, green: 0.1, blue: 0.05).opacity(0.6), radius: 4, x: 2, y: 2)
                            .shadow(color: Color(red: 0.3, green: 0.05, blue: 0.02).opacity(0.3), radius: 1, x: 1, y: 1)
                            .multilineTextAlignment(.center)
                            .opacity(titleOpacity * textOpacity)
                            .animation(
                                Animation.easeInOut(duration: 1.0)
                                    .delay(0.8),
                                value: titleOpacity
                            )
                        
                        Text("あなたのパンチの速さを世界に証明しよう！")
                            .font(.system(size: 18, weight: .medium))
                            .foregroundStyle(
                                LinearGradient(
                                    gradient: Gradient(colors: [
                                        Color(red: 0.9, green: 0.3, blue: 0.1),  // 鮮やかな赤
                                        Color(red: 1.0, green: 0.6, blue: 0.1),  // 鮮やかなオレンジ
                                        Color(red: 0.8, green: 0.4, blue: 0.0)   // 濃いオレンジ
                                    ]),
                                    startPoint: UnitPoint(x: gradientOffset, y: 0),
                                    endPoint: UnitPoint(x: gradientOffset + 1, y: 1)
                                )
                            )
                            .shadow(color: Color(red: 0.5, green: 0.1, blue: 0.05).opacity(0.5), radius: 3, x: 1, y: 1)
                            .multilineTextAlignment(.center)
                            .opacity(titleOpacity * textOpacity)
                            .animation(
                                Animation.easeInOut(duration: 1.0)
                                    .delay(1.2),
                                value: titleOpacity
                            )
                    }
                }
                
                // ゲームのルール
                VStack(spacing: 15) {
                    VStack(spacing: 15) {
                        HStack {
                            Image("boxing_glove")
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 20, height: 20)
                            
                            Text("ゲームのルール")
                                .font(.system(size: 18, weight: .bold))
                                .foregroundColor(.black)
                        }
                        
                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 15) {
                            // ルール1: パンチを記録
                            VStack(spacing: 8) {
                                ZStack {
                                    Circle()
                                        .fill(Color.orange)
                                        .frame(width: 40, height: 40)
                                    
                                    Image(systemName: "clock.arrow.circlepath")
                                        .font(.system(size: 20))
                                        .foregroundColor(.white)
                                }
                                
                                VStack(spacing: 4) {
                                    Text("1. パンチを記録")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundColor(.black)
                                    
                                    Text("パンチのイラストを撮影して投稿")
                                        .font(.system(size: 10))
                                        .foregroundColor(.gray)
                                        .multilineTextAlignment(.center)
                                }
                            }
                            
                            // ルール2: 速度を測定
                            VStack(spacing: 8) {
                                ZStack {
                                    Circle()
                                        .fill(Color(red: 1.0, green: 0.7, blue: 0.7))
                                        .frame(width: 40, height: 40)
                                    
                                    Image(systemName: "target")
                                        .font(.system(size: 20))
                                        .foregroundColor(.white)
                                }
                                
                                VStack(spacing: 4) {
                                    Text("2. 速度を測定")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundColor(.black)
                                    
                                    Text("専門の管理者が速度をkm/hで判定")
                                        .font(.system(size: 10))
                                        .foregroundColor(.gray)
                                        .multilineTextAlignment(.center)
                                }
                            }
                            
                            // ルール3: ランキングで競争
                            VStack(spacing: 8) {
                                ZStack {
                                    Circle()
                                        .fill(Color.yellow)
                                        .frame(width: 40, height: 40)
                                    
                                    Image(systemName: "trophy")
                                        .font(.system(size: 20))
                                        .foregroundColor(.white)
                                }
                                
                                VStack(spacing: 4) {
                                    Text("3. ランキングで競争")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundColor(.black)
                                    
                                    Text("他のプレイヤーと速さを競い合う")
                                        .font(.system(size: 10))
                                        .foregroundColor(.gray)
                                        .multilineTextAlignment(.center)
                                }
                            }
                            
                            // ルール4: 世界記録に挑戦
                            VStack(spacing: 8) {
                                ZStack {
                                    Circle()
                                        .fill(Color(red: 0.7, green: 1.0, blue: 0.7))
                                        .frame(width: 40, height: 40)
                                    
                                    Image(systemName: "bolt")
                                        .font(.system(size: 20))
                                        .foregroundColor(.white)
                                }
                                
                                VStack(spacing: 4) {
                                    Text("4. 世界記録に挑戦")
                                        .font(.system(size: 12, weight: .bold))
                                        .foregroundColor(.black)
                                    
                                    Text("最速のパンチで歴史に名を刻む")
                                        .font(.system(size: 10))
                                        .foregroundColor(.gray)
                                        .multilineTextAlignment(.center)
                                }
                            }
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 15)
                    .background(
                        RoundedRectangle(cornerRadius: 15)
                            .fill(Color.white)
                            .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
                    )
                }
                
                // パンチを開始ボタン（WEBアプリ版と同じスタイル）
                VStack(spacing: 20) {
                    Button(action: {
                        onComplete()
                    }) {
                        HStack(spacing: 15) {
                            Image("boxing_glove")
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 24, height: 24)
                            
                            Text("パンチを開始！")
                                .font(.system(size: 20, weight: .bold))
                                .foregroundStyle(
                                    LinearGradient(
                                        gradient: Gradient(colors: [
                                            Color(red: 1.0, green: 0.2, blue: 0.1),  // 鮮やかな赤
                                            Color(red: 1.0, green: 0.5, blue: 0.0),   // 鮮やかなオレンジ
                                            Color(red: 0.9, green: 0.3, blue: 0.0)    // 濃いオレンジ
                                        ]),
                                        startPoint: UnitPoint(x: gradientOffset, y: 0),
                                        endPoint: UnitPoint(x: gradientOffset + 1, y: 1)
                                    )
                                )
                        }
                        .padding(.horizontal, 50)
                        .padding(.vertical, 20)
                        .background(
                            RoundedRectangle(cornerRadius: 30)
                                .fill(Color.white)
                                .shadow(color: .black.opacity(0.15), radius: 8, x: 0, y: 4)
                        )
                    }
                    .scaleEffect(isAnimating ? 1.05 : 1.0)
                    .animation(
                        Animation.easeInOut(duration: 2.0)
                            .repeatForever(autoreverses: true),
                        value: isAnimating
                    )
                    
                    Text("クリックして世界一速いパンチに挑戦！")
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(
                            LinearGradient(
                                gradient: Gradient(colors: [
                                    Color(red: 1.0, green: 0.2, blue: 0.1),  // 鮮やかな赤
                                    Color(red: 1.0, green: 0.5, blue: 0.0),   // 鮮やかなオレンジ
                                    Color(red: 0.9, green: 0.3, blue: 0.0)    // 濃いオレンジ
                                ]),
                                startPoint: UnitPoint(x: gradientOffset, y: 0),
                                endPoint: UnitPoint(x: gradientOffset + 1, y: 1)
                            )
                        )
                        .shadow(color: Color(red: 0.6, green: 0.1, blue: 0.05).opacity(0.6), radius: 4, x: 2, y: 2)
                        .shadow(color: Color(red: 0.3, green: 0.05, blue: 0.02).opacity(0.3), radius: 1, x: 1, y: 1)
                        .opacity(loadingOpacity * textOpacity)
                        .multilineTextAlignment(.center)
                }
                .opacity(loadingOpacity)
                .animation(
                    Animation.easeInOut(duration: 1.0)
                        .delay(1.5),
                    value: loadingOpacity
                )
                
                Spacer()
            }
        }
        .onAppear {
            startAnimation()
        }
    }
    
    private func startAnimation() {
        // アニメーション開始
        withAnimation {
            isAnimating = true
            pulseScale = 1.3
        }
        
        // 段階的にアニメーションを開始
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            withAnimation {
                titleOpacity = 1.0
            }
        }
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            withAnimation {
                loadingOpacity = 1.0
            }
        }
        
        // テキストの透過率を時間変化させる（30~100%の範囲）
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            withAnimation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true)) {
                textOpacity = 1.0  // 100%の不透明度
            }
        }
        
        // グラデーションのアニメーション
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            withAnimation(.linear(duration: 3.0).repeatForever(autoreverses: false)) {
                gradientOffset = 1.0
            }
        }
    }
}

#Preview {
    SplashView(onComplete: {})
}
