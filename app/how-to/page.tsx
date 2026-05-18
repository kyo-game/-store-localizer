import Link from "next/link";

export default function HowToPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight">使い方</h1>
        <p className="mt-4 text-base text-white/70">
          Store Localizer は、App Store / Google Play 向け文面を文字数制限内で多言語翻訳するツールです。
        </p>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold">基本の流れ</h2>
          <ol className="mt-4 space-y-3 text-white/85">
            <li>1. 左側で元言語を選び、各フィールドに原文を入力します。</li>
            <li>2. 翻訳したいプランと言語を選びます。</li>
            <li>3. 翻訳を実行すると、結果が右側に表示されます。</li>
            <li>4. 各言語タブを開いて内容を確認し、必要に応じてコピーします。</li>
            <li>5. JSONファイルをダウンロードしておけば、あとでアップロードして過去の翻訳結果を再表示できます。</li>
          </ol>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold">対応フィールド</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 text-white/85">
            <div>・タイトル</div>
            <div>・サブタイトル</div>
            <div>・プロモーション用テキスト</div>
            <div>・概要</div>
            <div>・キーワード</div>
            <div>・最新情報</div>
            <div>・IAP表示名</div>
            <div>・IAP説明</div>
            <div>・サブスクグループ表示名</div>
            <div>・サブスクカスタム名</div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
          <h2 className="text-2xl font-semibold text-yellow-300">注意</h2>
          <ul className="mt-4 space-y-3 text-white/85">
            <li>・短い文字数制限のある項目では、意味を保ったまま短縮が優先されます。</li>
            <li>・言語によっては、日本語より長くなりやすく、完全に同じニュアンスを収めにくい場合があります。</li>
            <li>・タイトルやサブタイトルでは、文字数制限の都合で表現がやや圧縮されることがあります。</li>
            <li>・キーワード欄では、検索性の都合上、英語キーワードが混在していても問題扱いしない場合があります。</li>
            <li>・翻訳結果は公開前に必ず人の目で確認してください。</li>
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <h2 className="text-2xl font-semibold text-red-300">warning と error について</h2>

          <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4">
            <h3 className="text-lg font-semibold">warning</h3>
            <p className="mt-2 text-white/80">
              翻訳自体は成立しているものの、軽い違和感や圧縮による意味の揺れがある可能性を示します。
            </p>
            <ul className="mt-3 space-y-2 text-white/75">
              <li>・短縮の影響で表現が少し不自然</li>
              <li>・文字数制限のため一部の情報を落としている</li>
              <li>・意味は大きく崩れていないが、少し気になる表現がある</li>
            </ul>
            <p className="mt-3 text-sm text-white/60">
              warning が出た場合は、そのまま使う前に内容確認をおすすめします。
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
            <h3 className="text-lg font-semibold">error</h3>
            <p className="mt-2 text-white/80">
              その言語で安全に採用しにくいと判断された結果です。致命的な問題がある場合、英語フォールバックになることがあります。
            </p>
            <ul className="mt-3 space-y-2 text-white/75">
              <li>・文字数制限内に自然に収まらない</li>
              <li>・途中で切れたような不自然な文末</li>
              <li>・別言語の混入やスクリプト混在</li>
              <li>・意味ズレが大きい</li>
            </ul>
            <p className="mt-3 text-sm text-white/60">
              error が出た場合は、その結果をそのまま公開せず、手動で調整してください。
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold">よくあるケース</h2>
          <div className="mt-4 space-y-4 text-white/85">
            <div>
              <p className="font-medium">Q. 一部の言語だけ英語になりました</p>
              <p className="mt-1 text-white/70">
                A. その言語で文字数制限内に自然な表現を収めるのが難しく、error として英語フォールバックになった可能性があります。
              </p>
            </div>
            <div>
              <p className="font-medium">Q. warning は必ず直すべきですか？</p>
              <p className="mt-1 text-white/70">
                A. 軽微なものもありますが、公開前に確認する前提で使ってください。
              </p>
            </div>
            <div>
              <p className="font-medium">Q. 文字数が厳しい言語はありますか？</p>
              <p className="mt-1 text-white/70">
                A. あります。特にタイトル・サブタイトル・IAP表示名のような短い欄では、言語によって難易度が大きく変わります。
              </p>
            </div>
          </div>
        </section>

        <div className="mt-12 flex justify-center">
          <Link
            href="/"
            className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            ホームへ戻る
          </Link>
        </div>
      </div>
    </main>
  );
}