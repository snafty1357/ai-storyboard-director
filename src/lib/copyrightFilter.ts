// 著作権保護・アーキタイプ変換モジュール

export interface ConversionResult {
  original: string;
  converted: string;
  conversions: Array<{
    from: string;
    to: string;
    type: 'celebrity' | 'character' | 'brand' | 'artwork';
  }>;
  warnings: string[];
}

// 有名人データベース
const celebrityDatabase: Record<string, string> = {
  // 俳優（ハリウッド）
  'トム・クルーズ': '鋭い眼光を持つ中年男性、アクションヒーロー風の精悍な顔立ち',
  'ブラッド・ピット': '端正な顔立ちの金髪男性、カリスマ的な雰囲気',
  'レオナルド・ディカプリオ': '知的な表情の青い目の男性、繊細な雰囲気',
  'ジョニー・デップ': '個性的な風貌の男性、ボヘミアンな雰囲気、鋭い目',
  'ロバート・ダウニー・Jr': '知的でウィットに富んだ雰囲気の男性、髭を蓄えた',
  'キアヌ・リーブス': '長髪の穏やかな表情の男性、神秘的な雰囲気',
  'マット・デイモン': '誠実な雰囲気の男性、親しみやすい顔立ち',
  'クリス・エヴァンス': '筋肉質で正義感溢れる雰囲気の金髪男性',
  'クリス・ヘムズワース': '長身で筋肉質の金髪男性、力強い存在感',
  'ライアン・ゴズリング': 'クールで物静かな雰囲気の男性、鋭い目',

  // 女優（ハリウッド）
  'スカーレット・ヨハンソン': '神秘的な雰囲気を持つ女性、印象的な目',
  'アンジェリーナ・ジョリー': '力強い美しさを持つ女性、印象的な唇',
  'ナタリー・ポートマン': '知的で繊細な雰囲気の女性、大きな瞳',
  'エマ・ワトソン': '知的で凛とした雰囲気の女性、自然な美しさ',
  'ジェニファー・ローレンス': '自然体で親しみやすい雰囲気の女性',
  'マーゴット・ロビー': '華やかで明るい雰囲気の金髪女性',
  'ガル・ガドット': '凛とした強さを持つ女性、力強い目',
  'エマ・ストーン': '表情豊かで魅力的な赤毛の女性',

  // 韓国俳優
  'パク・ソジュン': '端正な顔立ちの韓国人男性、温かみのある笑顔',
  'イ・ミンホ': '長身で端正な顔立ちの韓国人男性',
  'ヒョンビン': '知的で落ち着いた雰囲気の韓国人男性',
  'ソン・ジュンギ': '爽やかで清潔感のある韓国人男性',

  // 日本俳優
  '木村拓哉': '端正な顔立ちの日本人男性、カリスマ的な雰囲気',
  '福山雅治': '知的で穏やかな雰囲気の日本人男性',
  '菅田将暉': '個性的で表情豊かな日本人男性',
  '新垣結衣': '自然体で親しみやすい日本人女性',
  '石原さとみ': '華やかで明るい雰囲気の日本人女性',
  '綾瀬はるか': '透明感のある美しさを持つ日本人女性',

  // ミュージシャン
  'テイラー・スウィフト': '金髪の長身女性、自信に満ちた雰囲気',
  'ビヨンセ': '力強く美しいアフリカ系女性、カリスマ的存在感',
  'BTS': 'スタイリッシュな若い韓国人男性グループ',
  'ブラックピンク': 'スタイリッシュな若い韓国人女性グループ',
};

// キャラクターデータベース
const characterDatabase: Record<string, string> = {
  // マーベル
  'スパイダーマン': '俊敏な若者、赤と青のコスチューム風の服装',
  'アイアンマン': 'ハイテク装備の天才発明家風の男性、メタリックな装飾',
  'キャプテン・アメリカ': '筋肉質で正義感あふれる男性、青と赤と白の配色',
  'ソー': '長い金髪の筋肉質な男性、神話的な雰囲気',
  'ハルク': '巨大で筋肉質な緑色の存在',
  'ブラック・ウィドウ': '赤毛の女性スパイ風、黒いタクティカルスーツ',

  // DC
  'バットマン': '黒いコートを着た謎めいた男性、夜の守護者',
  'スーパーマン': '筋肉質で正義感あふれる男性、青と赤の配色',
  'ワンダーウーマン': '力強い美しさを持つ女性戦士、古代ギリシャ風',
  'ジョーカー': '不気味な笑みを浮かべる男性、緑と紫のカラースキーム',
  'ハーレイ・クイン': 'ツインテールの個性的な女性、赤と青の配色',

  // ディズニー/ピクサー
  'エルサ': '銀髪の女性、氷のような青い衣装',
  'バズ・ライトイヤー': '宇宙服を着た男性キャラクター',

  // スタジオジブリ
  '千尋': '純粋な表情の日本人少女',
  'トトロ': '大きくてふわふわした森の精霊風の存在',
  'もののけ姫': '野性的な美しさを持つ少女、白い毛皮',

  // ゲーム
  'マリオ': '赤い帽子の陽気な配管工風の男性',
  'リンク': '緑の衣装を着た金髪の若い剣士',
  'クラウド': '大きな剣を持つスパイキーな金髪の若者',
};

// ブランドデータベース
const brandDatabase: Record<string, string> = {
  'Apple': 'シンプルでミニマルなテクノロジー企業風',
  'Nike': 'スポーティでダイナミックなデザイン',
  'コカ・コーラ': '赤と白の配色、クラシックなアメリカンスタイル',
  'McDonald\'s': '黄色と赤の配色、ファストフード風',
  'Google': 'カラフルでモダンなテクノロジー風',
  'Amazon': 'オレンジと黒の配色、eコマース風',
  'Tesla': '未来的でクリーンなデザイン',
  'Louis Vuitton': '高級感のあるブラウンのモノグラム風',
  'Gucci': 'ラグジュアリーで大胆なイタリアンスタイル',
};

// 作品データベース
const artworkDatabase: Record<string, string> = {
  'モナリザ': '神秘的な微笑みを浮かべる女性の肖像画風',
  '星月夜': '渦巻く夜空の風景画風',
  '叫び': '不安を表現した表現主義的なスタイル',
  '最後の晩餐': '宗教的な群像構図',
  'ゲルニカ': 'モノクロームのキュビズム風',
};

// メイン変換関数
export function filterCopyrightContent(text: string): ConversionResult {
  let converted = text;
  const conversions: ConversionResult['conversions'] = [];
  const warnings: string[] = [];

  // 有名人チェック
  for (const [celebrity, archetype] of Object.entries(celebrityDatabase)) {
    if (text.includes(celebrity)) {
      converted = converted.replace(new RegExp(celebrity, 'g'), archetype);
      conversions.push({
        from: celebrity,
        to: archetype,
        type: 'celebrity',
      });
      warnings.push(`実在の人物「${celebrity}」をアーキタイプに変換しました`);
    }
  }

  // キャラクターチェック
  for (const [character, archetype] of Object.entries(characterDatabase)) {
    if (text.includes(character)) {
      converted = converted.replace(new RegExp(character, 'g'), archetype);
      conversions.push({
        from: character,
        to: archetype,
        type: 'character',
      });
      warnings.push(`著作権キャラクター「${character}」をアーキタイプに変換しました`);
    }
  }

  // ブランドチェック
  for (const [brand, description] of Object.entries(brandDatabase)) {
    if (text.includes(brand)) {
      converted = converted.replace(new RegExp(brand, 'g'), description);
      conversions.push({
        from: brand,
        to: description,
        type: 'brand',
      });
      warnings.push(`商標「${brand}」を一般的な説明に変換しました`);
    }
  }

  // 作品チェック
  for (const [artwork, style] of Object.entries(artworkDatabase)) {
    if (text.includes(artwork)) {
      converted = converted.replace(new RegExp(artwork, 'g'), style);
      conversions.push({
        from: artwork,
        to: style,
        type: 'artwork',
      });
      warnings.push(`著作権作品「${artwork}」をスタイル記述に変換しました`);
    }
  }

  return {
    original: text,
    converted,
    conversions,
    warnings,
  };
}

// 警告バッジを生成
export function getCopyrightWarnings(text: string): string[] {
  const result = filterCopyrightContent(text);
  return result.warnings;
}

// コンテンツが安全かどうかをチェック
export function isSafeContent(text: string): boolean {
  const result = filterCopyrightContent(text);
  return result.conversions.length === 0;
}
