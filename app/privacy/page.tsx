export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold">プライバシーポリシー</h1>
        <p className="mt-3 text-sm text-zinc-400">最終更新日: 2026-04-14</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-zinc-200">
          <section>
            <h2 className="text-xl font-semibold">1. 基本方針</h2>
            <p className="mt-3">
              StoreLocalizer（以下「本サービス」）は、ユーザーのプライバシーを尊重し、個人情報を含む情報を適切に取り扱います。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. 取得する情報</h2>
            <p className="mt-3">
              本サービスでは、以下の情報を取得することがあります。
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>ユーザーが入力したテキスト、設定情報、翻訳対象データ</li>
              <li>決済に必要な情報、購入履歴、取引情報</li>
              <li>利用日時、アクセス元、ブラウザ種別、端末情報、IPアドレス等のアクセス情報</li>
              <li>Cookie、ローカルストレージ等を通じて保存される利用情報</li>
              <li>問い合わせ時に提供される氏名、メールアドレス、その他の連絡情報</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. 利用目的</h2>
            <p className="mt-3">
              取得した情報は、以下の目的で利用します。
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>本サービスの提供、維持、改善のため</li>
              <li>翻訳処理、保存、出力、購入機能等の提供のため</li>
              <li>料金決済、購入確認、不正利用防止のため</li>
              <li>問い合わせ対応、サポート対応のため</li>
              <li>障害対応、品質向上、利用状況分析のため</li>
              <li>規約違反、不正アクセス、悪用等への対応のため</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. 外部サービスの利用</h2>
            <p className="mt-3">
              本サービスは、機能提供や決済処理のため、外部サービスを利用することがあります。
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>翻訳API提供事業者</li>
              <li>決済代行事業者</li>
              <li>ホスティング、分析、障害監視、ログ管理等の外部サービス</li>
            </ul>
            <p className="mt-3">
              これらの外部サービスに対して、必要な範囲で情報が送信される場合があります。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Cookie等の利用</h2>
            <p className="mt-3">
              本サービスは、利便性向上、ログイン状態保持、利用状況分析等のためにCookie、ローカルストレージその他これに類する技術を利用する場合があります。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. 第三者提供</h2>
            <p className="mt-3">
              当方は、法令に基づく場合を除き、本人の同意なく個人情報を第三者に提供しません。
            </p>
            <p className="mt-3">
              ただし、決済処理、外部API利用、委託業務の実施等、本サービス提供に必要な範囲で外部事業者へ情報を提供する場合があります。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. データの保存期間</h2>
            <p className="mt-3">
              当方は、取得した情報を、利用目的の達成に必要な期間保存し、その後、不要となった情報を合理的な方法で削除または匿名化します。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. セキュリティ</h2>
            <p className="mt-3">
              当方は、情報の漏えい、滅失、毀損、不正アクセス等を防止するため、合理的な安全管理措置を講じます。
            </p>
            <p className="mt-3">
              ただし、インターネット通信およびシステムの性質上、完全な安全性を保証するものではありません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. ユーザーの権利</h2>
            <p className="mt-3">
              ユーザーは、法令の定めに従い、自己に関する個人情報について、開示、訂正、削除、利用停止等を求めることができます。
            </p>
            <p className="mt-3">
              これらの請求を希望する場合は、当方の問い合わせ窓口まで連絡してください。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. 子どもの利用</h2>
            <p className="mt-3">
              本サービスは、保護者の同意を得ずに個人情報を提供すべきではない年齢の利用者を想定したものではありません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">11. ポリシーの変更</h2>
            <p className="mt-3">
              当方は、必要に応じて本ポリシーを変更できるものとします。変更後の内容は、本サービス上に掲載した時点で効力を生じます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">12. お問い合わせ</h2>
            <p className="mt-3">
              本ポリシーに関する問い合わせは、当方が別途定める問い合わせ先までご連絡ください。
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}