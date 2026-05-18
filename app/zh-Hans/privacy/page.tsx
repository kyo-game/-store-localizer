export default function ZhHansPrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-3xl font-bold">隐私政策</h1>
        <p className="mt-3 text-sm text-zinc-400">最后更新：2026-04-14</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-zinc-200">
          <section>
            <h2 className="text-xl font-semibold">1. 基本方针</h2>
            <p className="mt-3">
              StoreLocalizer（“本服务”）尊重用户隐私，并会妥善处理包括个人信息在内的相关信息。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. 我们收集的信息</h2>
            <p className="mt-3">
              本服务可能会收集以下信息：
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>用户输入的文本、设置以及翻译目标数据</li>
              <li>支付处理、购买记录和交易所需的信息</li>
              <li>使用日期和时间、来源页面、浏览器类型、设备信息、IP 地址等访问信息</li>
              <li>通过 Cookie、本地存储及类似技术保存的使用信息</li>
              <li>用户在咨询时提供的姓名、邮箱地址及其他联系方式</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. 使用目的</h2>
            <p className="mt-3">
              收集的信息将用于以下目的：
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>提供、维护和改进本服务</li>
              <li>提供翻译处理、保存、导出和购买功能</li>
              <li>处理支付、确认购买并防止欺诈</li>
              <li>回复咨询并提供支持</li>
              <li>处理问题、提升质量并分析使用情况</li>
              <li>应对违反条款、未经授权访问、滥用及类似问题</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. 第三方服务的使用</h2>
            <p className="mt-3">
              本服务可能会使用第三方服务来提供功能并处理支付。
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>翻译 API 提供商</li>
              <li>支付处理服务商</li>
              <li>用于托管、分析、监控和日志管理的外部服务</li>
            </ul>
            <p className="mt-3">
              在必要范围内，信息可能会传输至这些第三方服务。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Cookie 及类似技术的使用</h2>
            <p className="mt-3">
              本服务可能会使用 Cookie、本地存储及类似技术，以提升便利性、
              维持登录状态并分析使用情况。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. 向第三方提供信息</h2>
            <p className="mt-3">
              除法律要求外，未经用户同意，我们不会向第三方提供个人信息。
            </p>
            <p className="mt-3">
              但是，为了提供本服务所需的支付处理、外部 API 使用以及委托业务，
              可能会在必要范围内向外部服务提供商提供信息。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. 数据保存期限</h2>
            <p className="mt-3">
              我们将在实现使用目的所需的期间内保存所收集的信息，
              之后会通过合理方式删除或匿名化不再需要的信息。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">8. 安全措施</h2>
            <p className="mt-3">
              我们会采取合理的安全措施，以防止信息泄露、丢失、损坏及未经授权访问。
            </p>
            <p className="mt-3">
              但鉴于互联网通信和系统的性质，无法保证绝对安全。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">9. 用户权利</h2>
            <p className="mt-3">
              根据适用法律，用户可以就其个人信息请求披露、更正、删除、
              停止使用及类似处理。
            </p>
            <p className="mt-3">
              如需提出此类请求，请通过指定的联系方式与我们联系。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">10. 儿童使用</h2>
            <p className="mt-3">
              本服务并非面向未经监护人同意不得提供个人信息的用户。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">11. 本政策的变更</h2>
            <p className="mt-3">
              我们可能会根据需要变更本政策。任何变更将在发布于本服务时生效。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">12. 联系方式</h2>
            <p className="mt-3">
              如对本政策有任何疑问，请通过我们另行提供的联系方式与我们联系。
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}