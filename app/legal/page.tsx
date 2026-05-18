export default function LegalPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold">特定商取引法に基づく表記</h1>
        <p className="mt-3 text-sm text-zinc-400">最終更新日: 2026-04-14</p>

        <div className="mt-10 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
          <div className="divide-y divide-zinc-800 text-sm">
            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">販売事業者名</div>
              <div className="text-zinc-100">KYO-GAME</div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">運営責任者</div>
              <div className="text-zinc-100">渡邊 恭一</div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">所在地</div>
              <div className="text-zinc-100">
                請求があった場合、遅滞なく開示します。
              </div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">電話番号</div>
              <div className="text-zinc-100">
                請求があった場合、遅滞なく開示します。
              </div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">メールアドレス</div>
              <div className="text-zinc-100">kyogame.com@gmail.com</div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">サイトURL</div>
              <div className="text-zinc-100">https://storelocalizer.com</div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">販売価格</div>
              <div className="space-y-2 text-zinc-100">
                <p>各商品ページまたは購入画面に表示された金額</p>
                <ul className="list-disc pl-5 text-zinc-300">
                  <li>1フィールド翻訳 Lite / Standard / Pro</li>
                  <li>全フィールド翻訳 Lite / Standard / Pro</li>
                </ul>
              </div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">商品代金以外の必要料金</div>
              <div className="text-zinc-100">
                インターネット接続料金、通信料金等はユーザー負担です。
              </div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">支払方法</div>
              <div className="text-zinc-100">
                クレジットカード等、購入画面で表示する方法
              </div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">支払時期</div>
              <div className="text-zinc-100">
                購入手続完了時に決済されます。
              </div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">役務の提供時期</div>
              <div className="text-zinc-100">
                決済完了後、所定の処理完了後にサービスを利用できます。
              </div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">返品・キャンセル</div>
              <div className="text-zinc-100">
                デジタルサービスの性質上、決済完了後の返品・返金・キャンセルには、法令上必要な場合を除き原則対応していません。
              </div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">動作環境</div>
              <div className="text-zinc-100">
                最新版の主要ブラウザ（Chrome、Safari、Edge 等）を推奨します。
              </div>
            </div>

            <div className="grid gap-3 px-6 py-5 md:grid-cols-[220px_1fr]">
              <div className="font-semibold text-zinc-300">表現およびサービスに関する注意書き</div>
              <div className="text-zinc-100">
                本サービスの翻訳結果、文字数制限適合、審査通過等を保証するものではありません。公開前に必ずご自身で内容をご確認ください。
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}