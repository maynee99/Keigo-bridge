import { ToneTool } from "@/components/ToneTool";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-10 sm:py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Keigo Bridge{" "}
          <span lang="ja" className="text-lg font-normal text-stone-500 dark:text-stone-400">
            敬語ブリッジ
          </span>
        </h1>
        <p className="text-stone-600 dark:text-stone-400">
          Say it the right way in Japanese for whoever you&apos;re talking to. Type in English and
          get the Japanese, or paste your own Japanese and check its tone.
        </p>
      </header>

      <ToneTool />

      <footer className="border-t border-stone-200 pt-6 text-sm text-stone-500 dark:border-stone-800 dark:text-stone-400">
        Built with the Claude API. AI can get Japanese wrong, so for anything important, have a
        native speaker check it.
      </footer>
    </main>
  );
}
