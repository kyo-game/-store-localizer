import Link from "next/link";

export default function ZhHansHowToPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-4xl font-bold tracking-tight">使用方法</h1>
        <p className="mt-4 text-base text-white/70">
          Store Localizer 是一款可在字符数限制内，将 App Store 和 Google Play 商店文案翻译成多种语言的工具。
        </p>

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold">基本流程</h2>
          <ol className="mt-4 space-y-3 text-white/85">
            <li>1. 在左侧选择源语言，并输入原始商店文案。</li>
            <li>2. 选择套餐和要翻译的目标语言。</li>
            <li>3. 执行翻译后，结果会显示在右侧。</li>
            <li>4. 检查各语言标签，并复制需要使用的字段。</li>
            <li>5. 下载 JSON 文件后，以后可以再次上传并恢复这些翻译结果。</li>
          </ol>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold">支持的字段</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 text-white/85">
            <div>- 标题</div>
            <div>- 副标题</div>
            <div>- 推广文本</div>
            <div>- 应用描述</div>
            <div>- 关键词</div>
            <div>- 本版本更新内容</div>
            <div>- IAP 显示名称</div>
            <div>- IAP 描述</div>
            <div>- 订阅组显示名称</div>
            <div>- 订阅自定义名称</div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
          <h2 className="text-2xl font-semibold text-yellow-300">重要说明</h2>
          <ul className="mt-4 space-y-3 text-white/85">
            <li>- 对于字符数限制严格的短字段，会优先确保不超过限制，而不是完整保留原文的所有细节。</li>
            <li>- 有些语言本身会比日语或英语更长，因此可能难以完全保留语气和细节。</li>
            <li>- 标题、副标题和较短的购买标签可能会被压缩表达，以符合字符数限制。</li>
            <li>- 在关键词字段中，如果英语关键词对搜索有用，可能会保留，并不视为问题。</li>
            <li>- 发布前请务必自行检查最终文本。</li>
          </ul>
        </section>

        <section className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <h2 className="text-2xl font-semibold text-red-300">关于 warning 和 error</h2>

          <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4">
            <h3 className="text-lg font-semibold">warning</h3>
            <p className="mt-2 text-white/80">
              翻译结果可以使用，但由于字符数限制，可能存在轻微不自然、压缩表达或细微语义偏差。
            </p>
            <ul className="mt-3 space-y-2 text-white/75">
              <li>- 表达略显不自然</li>
              <li>- 为了符合字符数限制，省略了部分细节</li>
              <li>- 大意基本保留，但措辞可能需要快速确认</li>
            </ul>
            <p className="mt-3 text-sm text-white/60">
              如果显示 warning，请在公开使用前检查结果。
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
            <h3 className="text-lg font-semibold">error</h3>
            <p className="mt-2 text-white/80">
              该结果被判断为不适合直接使用。有时可能会返回英文作为 fallback。
            </p>
            <ul className="mt-3 space-y-2 text-white/75">
              <li>- 文本无法自然地控制在字符数限制内</li>
              <li>- 结尾看起来被截断或不自然</li>
              <li>- 结果中混入了其他语言或文字体系</li>
              <li>- 语义偏差过大</li>
            </ul>
            <p className="mt-3 text-sm text-white/60">
              如果显示 error，请不要直接发布该结果。请手动重写或调整。
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-2xl font-semibold">常见情况</h2>
          <div className="mt-4 space-y-4 text-white/85">
            <div>
              <p className="font-medium">Q. 为什么某个语言返回了英文？</p>
              <p className="mt-1 text-white/70">
                A. 通常表示该语言无法在字符数限制内生成安全且自然的结果，因此回退为英文。
              </p>
            </div>
            <div>
              <p className="font-medium">Q. warning 一定需要修改吗？</p>
              <p className="mt-1 text-white/70">
                A. 不一定，但发布前仍然建议检查。
              </p>
            </div>
            <div>
              <p className="font-medium">Q. 有些语言会更难翻译吗？</p>
              <p className="mt-1 text-white/70">
                A. 会。标题、副标题、IAP 名称等非常短的字段，根据目标语言不同会更难处理。
              </p>
            </div>
          </div>
        </section>

        <div className="mt-12 flex justify-center">
          <Link
            href="/zh-Hans"
            className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            返回首页
          </Link>
        </div>
      </div>
    </main>
  );
}