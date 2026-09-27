import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArticleView } from '@/components/article-view'
import { getArticle, getArticles } from '@/lib/articles'
import { pageMetadata } from '@/lib/seo'

type Params = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return getArticles('research').map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const article = getArticle('research', slug)
  if (!article) return {}
  return pageMetadata({
    title: `${article.title} — Spectra Technologies`,
    description: article.excerpt,
    path: `/research/${article.slug}`,
  })
}

export default async function ResearchArticlePage({ params }: Params) {
  const { slug } = await params
  const article = getArticle('research', slug)
  if (!article) notFound()
  return <ArticleView article={article} />
}
