import Link from 'next/link'
import type { Article, ArticleSection } from '@/lib/articles'
import SiteHeader from './site-header'
import SiteFooter from './site-footer'
import { PageHero } from './page-hero'
import { ArrowUpRight } from './icon'

const SECTION_META: Record<ArticleSection, { kicker: string; index: string; name: string }> = {
  journal: { kicker: 'THE SPECTRA JOURNAL', index: '/journal', name: 'The Journal' },
  research: { kicker: 'RESEARCH & INSIGHTS', index: '/research', name: 'Research & Insights' },
  newsroom: { kicker: 'NEWSROOM', index: '/newsroom', name: 'Newsroom' },
}

/** Shared reading view for every Journal, Research and Newsroom article. */
export function ArticleView({ article }: { article: Article }) {
  const meta = SECTION_META[article.section]

  return (
    <main id="main" className="spectra-shell">
      <SiteHeader />

      <PageHero
        compact
        kicker={`${meta.kicker} / ARTICLE`}
        title={article.title}
        tag={`SPECTRA / ${article.source}`}
      >
        <p>{article.excerpt}</p>
      </PageHero>

      <section className="page-section">
        <article className="page-prose article-body">
          <p className="article-byline">
            {article.source} · {article.date} · {article.readTime}
          </p>
          {article.body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </article>

        <div className="article-nav">
          <Link className="text-button" href={meta.index}>
            Back to {meta.name} <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <Link className="text-button" href="/contact">
            Talk to us <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
