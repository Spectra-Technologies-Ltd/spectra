export type ArticleSection = 'journal' | 'research' | 'newsroom'

export type Article = {
  section: ArticleSection
  slug: string
  source: string
  title: string
  date: string
  readTime: string
  excerpt: string
  body: string[]
}

export const ARTICLES: Article[] = [
  {
    section: 'journal',
    slug: 'why-we-built-an-operating-system-for-security-operations',
    source: 'THE JOURNAL',
    title: 'Why we built an operating system for security operations.',
    date: '08.10.26',
    readTime: '6 min read',
    excerpt:
      'The short version: spreadsheets and radio chatter are not an operating picture. The long version starts with a patrol route that never gets walked.',
    body: [
      "Most security operations do not fail because the people in them are careless. They fail because the picture in front of those people is assembled from scraps. A guard posts to a group chat, a supervisor logs a patrol in a spreadsheet, and a manager reconciles the two days later when something has already gone wrong.",
      'We kept running into the same pattern. The tools existed, the staff were diligent, and the data was technically there. What was missing was a single surface where the state of an operation could be read at a glance and trusted without a follow-up phone call.',
      'An operating system for security operations is not a dashboard with more tiles. It is the layer that decides what is real, what is current, and what deserves attention. That layer has to sit beneath the apps an operator uses rather than beside them, or it becomes one more place to check.',
      'The test we hold ourselves to is simple. If a supervisor walks away and the operation still runs with the same coherence, the system is doing its job. If it collapses back into radio chatter the moment nobody is watching, we have built another instrument that needs a hand on it.',
      'That is the standard we are building BastionOS against, and it is why the foundation matters more than any single feature. A patrol route that never gets walked is, in the end, a data problem before it is a discipline problem.',
    ],
  },
  {
    section: 'journal',
    slug: 'signals-not-noise-what-napoleon-actually-learns-from',
    source: 'THE JOURNAL',
    title: 'Signals, not noise: what Napoleon actually learns from.',
    date: '07.22.26',
    readTime: '5 min read',
    excerpt:
      'Every operation, transaction and movement creates a signal. Most of it stays fragmented. This is what happens when you put it together.',
    body: [
      'A signal is any event that leaves a trace. A gate opening, a shift starting late, a patrol checkpoint scanned out of sequence. None of these things are meaningful alone, and that is precisely why so much operational knowledge quietly evaporates.',
      'Napoleon is built on the premise that the value is in the relationships between signals rather than in any single one. Two late check-ins are noise. Twenty late check-ins clustered at one post across a month is a pattern that names its own cause.',
      'The hard part is not collecting more data. Most operations are already drowning in it. The hard part is deciding which fragments belong together, which differences are normal variation, and which departures are worth an operator turning their head toward.',
      'We design for that decision rather than for the raw volume. Every signal that enters the layer either sharpens the operational picture or is set aside. Noise, in this framing, is not a nuisance to filter at the end. It is the thing the architecture is organised to never mistake for signal.',
      'What Napoleon learns, then, is not a catalogue of facts but a working model of how an operation behaves when it is healthy. The useful output is the gap between that model and the present moment.',
    ],
  },
  {
    section: 'journal',
    slug: 'infrastructure-is-the-strategy',
    source: 'THE JOURNAL',
    title: 'Infrastructure is the strategy.',
    date: '06.30.26',
    readTime: '5 min read',
    excerpt:
      'Software that decides is only as good as the environment it runs in. Why we treat the foundation as the product.',
    body: [
      'There is a comfortable idea that strategy lives at the top and infrastructure is just plumbing beneath it. We think that gets the relationship backwards. Every decision a system makes is bounded by the environment it runs in, and a ceiling in the foundation becomes a ceiling on every judgement above it.',
      'This is why we treat the Spectra Architecture as a single product rather than a set of layers to be assembled by the customer. Infrastructure, intelligence and application are not separate purchases. They are one argument about how a signal becomes a decision.',
      'When the foundation is treated as an afterthought, teams spend their energy compensating for it. They rebuild the same integrations, reconcile the same conflicting sources, and reimplement the same guarantees in every application. That work is invisible in a feature list and enormous in practice.',
      'Getting the environment right is slower at the start and cheaper forever after. It also changes what the software above can honestly promise. A system with a stable foundation can commit to consistency; a system without one can only commit to best effort.',
      'So when we say infrastructure is the strategy, we mean it literally. The interesting decisions are the ones fixed early, before anyone can see the feature they will eventually enable.',
    ],
  },
  {
    section: 'journal',
    slug: 'from-first-signal-to-final-decision',
    source: 'THE JOURNAL',
    title: 'From first signal to final decision.',
    date: '06.02.26',
    readTime: '6 min read',
    excerpt:
      'A walk through the chain that turns a raw sensor reading into a decision an operator can act on — and the humans we keep in the loop.',
    body: [
      'A decision begins as something small and unglamorous. A sensor reports a reading, a checkpoint records a scan, a message arrives from the field. On its own it is a fact with no weight and no direction.',
      'The first thing the chain does is establish context. Where did this come from, what was happening around it, and what does the operation consider normal at this hour and this location. Without that frame, the signal cannot be ranked, and an operator has no basis for caring about it yet.',
      'From there the intelligence layer does its work. It aligns the signal with others, tests it against the learned shape of the operation, and produces something an operator can actually use: a relationship, a pattern, a prediction, a recommendation. This is the part that separates a decision from a notification.',
      'The final step is the one we refuse to automate away. A recommendation reaches a person, in language that explains why it matters, and that person decides. The system is designed to make the choice clearer and faster, not to remove the choice altogether.',
      'Keeping a human in the loop is not a concession to caution. It is the design. Decisions carry consequences, and a decision that cannot be explained to the person who owns it is not a decision the operation can stand behind.',
      'That is the whole chain, from first signal to final decision, and the discipline is in keeping every link honest about what it knows.',
    ],
  },
  {
    section: 'journal',
    slug: 'small-team-big-horizon',
    source: 'THE JOURNAL',
    title: 'Small team, big horizon.',
    date: '05.11.26',
    readTime: '4 min read',
    excerpt:
      'How we build foundational technology with a small group of engineers who care about the details.',
    body: [
      'A big horizon does not require a big team. It requires a team that agrees on the horizon and is willing to spend years on the parts nobody applauds. We have chosen the second path deliberately, and it shapes almost everything about how we work.',
      'Small teams hold a shared model in their heads. When the architecture lives in a room rather than in a document, decisions get made faster and contradictions get caught early. The cost is that every person has to range across the stack, and that is a feature rather than a burden.',
      'Foundational technology punishes shortcuts. A quick fix in the infrastructure layer becomes a decade of compensation in everything above it. Because there is no separate team to hand that debt to, we feel it immediately, and we tend to avoid creating it.',
      'We are also wary of the growth reflex. Adding people is the easiest way to appear to move faster, and one of the surest ways to slow down a system that depends on coherence. We would rather stay small and raise the standard than scale and lose the thread.',
      'The horizon we are aiming at is one where security operations run on a stable foundation that most people never have to think about. That is a long build, and a small team is the right instrument for it.',
    ],
  },
  {
    section: 'research',
    slug: 'napoleon-machine-intelligence-from-signal-to-action',
    source: 'TECHNICAL BRIEF',
    title: 'Napoleon: machine intelligence from signal to action.',
    date: '07.28.26',
    readTime: '7 min read',
    excerpt:
      'How the strategic intelligence engine learns from fragmented organizational data and turns it into decision intelligence — relationships, patterns, predictions, recommendations.',
    body: [
      'Napoleon is the intelligence layer of the Spectra Architecture. Its purpose is to take fragmented organisational data and produce something an operator can act on, in that order and without skipping a step.',
      'The engine begins by resolving entities. The same site, guard, vehicle or incident often appears under several names across several systems. Until those references are reconciled into a single identity, any pattern found is likely to be an artifact of the fragmentation rather than a fact about the operation.',
      'With identities resolved, Napoleon builds relationships. It maps who and what interact with whom, how often, and under what conditions. Relationships are the medium through which the engine moves from description to understanding, because they carry the context that isolated records lack.',
      'Patterns sit on top of those relationships, and they are learned rather than declared. The engine forms a working model of normal operation and watches for coherent departures from it. A single anomaly is a question. A structure of related anomalies is a finding.',
      'Predictions and recommendations are the outward-facing products of that model. A prediction estimates what is likely to happen next; a recommendation proposes what could be done about it. Both are expressed as input to a human decision rather than as an instruction to be followed.',
      'The discipline throughout is to keep the engine explainable at each stage. An operator who cannot see why Napoleon reached a conclusion cannot weight it properly, and a conclusion that cannot be weighted is not decision intelligence.',
    ],
  },
  {
    section: 'research',
    slug: 'how-infrastructure-intelligence-data-and-applications-fit-together',
    source: 'ARCHITECTURE NOTES',
    title: 'How infrastructure, intelligence, data and applications fit together.',
    date: '06.10.26',
    readTime: '7 min read',
    excerpt:
      'A walk through the Spectra Architecture — the integrated stack from first signal to final decision, and where each layer lives.',
    body: [
      'The Spectra Architecture describes one continuous path from a raw signal to a final decision. It is useful to name the layers, but it is more important to understand that they are stages of a single process rather than separate products bolted together.',
      'Infrastructure sits at the base and is deliberately unexciting. It handles identity, connectivity, storage and the guarantees that everything above depends on. Its success is measured by how little the layers above have to think about it.',
      'Data is the layer where raw events become trustworthy. Ingestion, normalisation and entity resolution happen here. By the time a signal has crossed this layer, it has a stable identity and a known relationship to the rest of the operational picture.',
      'Intelligence is where Napoleon lives. It consumes the resolved picture and produces relationships, patterns, predictions and recommendations. Notably, it does not talk to the operator directly; it hands its output upward as structured input.',
      'Applications are the surface an operator actually touches, and BastionOS is the principal one. Patrols, attendance, incidents and reporting are presented here, with the intelligence layer feeding context into each view rather than living in a separate tool.',
      'Keeping this stack integrated is the whole argument. Each layer can be reasoned about alone, but its value only appears when the signal crosses all of them without a translation step that loses meaning along the way.',
    ],
  },
  {
    section: 'research',
    slug: 'multi-sensor-fusion-in-the-intelligence-layer',
    source: 'TECHNICAL BRIEF',
    title: 'Multi-sensor fusion in the intelligence layer.',
    date: '05.19.26',
    readTime: '6 min read',
    excerpt:
      'Video, radar, acoustic and environmental signals — how Napoleon aligns disparate sources into a single operational picture.',
    body: [
      'Video, radar, acoustic and environmental sensors each describe the world in a different language. Video gives detail but no range; radar gives range but no identity; acoustic gives presence but no position. Fusion is the work of turning these partial views into one account.',
      'The first requirement is alignment in time. Sensors report on their own clocks and at their own cadences, so the layer must place events on a common timeline before it can ask whether two readings describe the same moment and the same thing.',
      'The second requirement is alignment in space. A camera mounted on a pole and a radar unit across a yard occupy different frames of reference. Until both are expressed in a shared operational geometry, any comparison between them is guesswork.',
      'Once aligned, the layer weighs the sources against each other. Agreement raises confidence; disagreement is not discarded but preserved as a signal in its own right, because the most interesting situations are often the ones where the instruments do not tell the same story.',
      'Napoleon maintains this fused picture as a continuously updated model. New readings refine it rather than replace it, so the operator sees one operation instead of four instrument feeds and the burden of reconciliation.',
      'Fusion does not eliminate uncertainty, and we do not pretend otherwise. Its value is that it turns disagreement between sources into something visible and analysable, rather than something an operator has to notice on their own.',
    ],
  },
  {
    section: 'research',
    slug: 'the-latency-question-decision-support-at-the-edge',
    source: 'ARCHITECTURE NOTES',
    title: 'The latency question: decision support at the edge.',
    date: '04.08.26',
    readTime: '6 min read',
    excerpt:
      'Why response time is a design property, not a performance metric — and how the architecture keeps the loop short.',
    body: [
      'Response time is usually treated as a performance metric, something to be optimised once the system works. We treat it as a design property, decided early and allowed to shape the architecture rather than chase it afterwards.',
      'The reason is that a decision has a window. A recommendation that arrives after the situation has moved on is not a fast recommendation delivered late; it is a different and less useful artifact. Latency is therefore part of whether the output is meaningful at all.',
      'Keeping the loop short begins with placement. Work that must happen near the event is done at the edge, close to the sensors and the operators, while work that benefits from a wider view is done centrally. The architecture is explicit about which is which.',
      'The second lever is what has to travel. The layer resolves and summarises at the edge so that the central system receives meaning rather than a flood of raw telemetry. Less to move means less to wait for.',
      'The third lever is graceful degradation. When connectivity is poor, the edge continues to operate on the model it holds, and reconciles with the centre when the link returns. A decision loop that stops entirely when the network wobbles is not fit for the field.',
      'None of this is free, and it constrains where intelligence can live. We accept that constraint because a short loop is what makes the rest of the system worth having.',
    ],
  },
  {
    section: 'research',
    slug: 'anomaly-detection-on-operational-data',
    source: 'RESEARCH NOTE',
    title: 'Anomaly detection on operational data.',
    date: '03.02.26',
    readTime: '5 min read',
    excerpt:
      'What it takes to flag the pattern before the incident — and how continuous learning changes what the model can see.',
    body: [
      'Anomaly detection in an operational setting is not the same problem as spotting an outlier in a dataset. The goal is not to rank unusual values but to flag a developing pattern while there is still time to act on it.',
      'That shifts the emphasis from the individual observation to the shape of the drift around it. A guard arriving a few minutes early is unremarkable. A slow, consistent erosion of coverage across one patrol route over several weeks is a finding, and it is invisible to any test that looks at points in isolation.',
      'Operational data also changes its own meaning over time. Sites expand, shifts are redesigned, seasons alter movement patterns. A model fixed at one moment will either drift into irrelevance or start flagging legitimate change as a problem, and neither failure is obvious until it has been happening for a while.',
      'Continuous learning is how we address that. The model updates against the current shape of the operation rather than a snapshot of it, so what counts as normal moves with the environment instead of lagging behind it.',
      'The output we care about is not a score but a defensible signal. An operator should be able to see what shifted, over what period, and why the system considers it worth attention. Continuous learning changes what the model can see, but explainability is what makes what it sees usable.',
    ],
  },
  {
    section: 'newsroom',
    slug: 'the-spectra-workplace-is-now-live',
    source: 'PRODUCT UPDATE',
    title: 'The Spectra Workplace is now live.',
    date: '05.22.26',
    readTime: '4 min read',
    excerpt:
      'Operators can now manage their entire security operation from the BastionOS command center — guards, patrols, attendance, incidents and reporting in one real-time view.',
    body: [
      'The Spectra Workplace is now live. It is the operator command center for BastionOS, and it brings the day-to-day of a security operation into a single real-time view.',
      'Guards, patrols, attendance, incidents and reporting have historically been handled across separate tools, with the gaps between them filled by phone calls. The Workplace closes those gaps by presenting the state of each in one place, updated as events occur.',
      'For supervisors, the change is mostly about time. The morning checks, the reconciliation of who was where, and the assembly of a picture before a briefing now happen against a live view rather than a reconstructed one.',
      'For operations leads, the value is continuity. The Workplace keeps a consistent record of an operation across shifts, so context survives a handover instead of being rebuilt from memory each time.',
      'This is the first release of the Workplace, and it mirrors the Spectra approach more broadly: put the operational picture on a stable foundation, then let the surface evolve on top of it.',
    ],
  },
  {
    section: 'newsroom',
    slug: 'bastionos-2-0-unified-patrols-and-incident-tracking',
    source: 'ANNOUNCEMENT',
    title: 'BastionOS 2.0: unified patrols and incident tracking.',
    date: '04.14.26',
    readTime: '4 min read',
    excerpt:
      'Patrol verification, incident escalation and reporting now share one workflow — with Napoleon-powered insights layered on top.',
    body: [
      'BastionOS 2.0 unifies patrols and incident tracking into one workflow. Patrol verification, incident escalation and reporting no longer live in separate systems that have to be stitched together after the fact.',
      'The practical effect is that an incident raised during a patrol carries its own context with it. The route, the checkpoint, the time and the surrounding activity travel with the escalation, so the person receiving it starts with the picture rather than a description.',
      'Unifying the workflow also simplifies reporting. Because patrols and incidents are recorded in one place, a report is a view of what already happened rather than a reconstruction task that competes for attention with the next shift.',
      'Napoleon is layered on top of this unified record. The intelligence engine reads across patrols and incidents together, which is what allows it to surface patterns that would be invisible if the two were kept apart.',
      'Version 2.0 is a consolidation release for us. The goal was not more surface area but fewer seams, and most of the work went into making the operational record whole.',
    ],
  },
  {
    section: 'newsroom',
    slug: 'napoleon-enters-preview-for-enterprise-operations',
    source: 'ANNOUNCEMENT',
    title: 'Napoleon enters preview for enterprise operations.',
    date: '03.18.26',
    readTime: '4 min read',
    excerpt:
      'The strategic intelligence engine is now available in preview for select enterprise operations — learning from operational data to surface patterns and predictions.',
    body: [
      'Napoleon, the strategic intelligence engine at the centre of the Spectra Architecture, is now available in preview for select enterprise operations.',
      'The engine learns from an organisation\u2019s own operational data. It builds a working model of how that operation behaves, then surfaces patterns, predictions and recommendations that follow from departures in the live picture.',
      'Preview access is deliberately limited. The engine\u2019s output depends on the quality and coherence of the data beneath it, and we would rather work closely with a small number of operations than widen access before that foundation is solid.',
      'Participants should expect the engine to be useful and candid in equal measure. It will surface relationships and patterns that were previously invisible, and it will also make plain where an operation\u2019s data is too fragmented to support a confident conclusion.',
      'This is the first step toward making decision intelligence a normal part of enterprise security operations rather than a specialist capability reserved for the few who can assemble it themselves.',
    ],
  },
  {
    section: 'newsroom',
    slug: 'multi-site-visibility-one-command-center',
    source: 'PRODUCT UPDATE',
    title: 'Multi-site visibility, one command center.',
    date: '02.09.26',
    readTime: '4 min read',
    excerpt:
      'BastionOS now unifies every site under a single operational picture — coverage, attendance and risk in one view.',
    body: [
      'BastionOS now unifies every site under a single operational picture. Coverage, attendance and risk can be read across an entire estate from one command center instead of site by site.',
      'Multi-site operations have a particular failure mode. Each site looks healthy in isolation while the estate as a whole drifts, because no one is looking at the whole. A single view makes that drift visible while it is still small.',
      'The unified picture is built on the same foundation the rest of BastionOS uses, so consistency between sites is a property of the platform rather than something maintained by convention. A metric means the same thing everywhere it appears.',
      'For operators, the change is a shift in altitude. It becomes practical to compare coverage and attendance across sites, and to notice when one location is carrying more risk than the others for reasons that are not obvious locally.',
      'This release continues the direction of the platform. Each step makes the operational picture more complete, so that decisions are made against the whole estate rather than a single vantage point.',
    ],
  },
  {
    section: 'newsroom',
    slug: 'the-spectra-partners-program-opens',
    source: 'ANNOUNCEMENT',
    title: 'The Spectra partners program opens.',
    date: '01.20.26',
    readTime: '4 min read',
    excerpt:
      'Technology integrations, channel partnerships and co-development — teams building on the Spectra architecture can now apply.',
    body: [
      'The Spectra partners program is now open. It is aimed at teams that want to build on the Spectra Architecture rather than beside it, across technology integrations, channel partnerships and co-development.',
      'The program is structured around the architecture itself. Because infrastructure, intelligence and application are designed as one integrated stack, partners build against a stable foundation and a defined boundary rather than an ad hoc set of endpoints.',
      'Technology integrations are for teams whose hardware or software produces operational signals that belong in the picture. Channel partnerships are for organisations that already serve security operations and want to bring BastionOS to the customers they know.',
      'Co-development is the deepest track and the most selective. It is for partners with a specific operational problem that the platform should solve properly, and who are willing to work on it alongside our engineers.',
      'Applications are open now. We are reviewing them carefully, and we would rather onboard partners slowly and well than announce a large programme we cannot support.',
    ],
  },
]

export function getArticle(
  section: ArticleSection,
  slug: string
): Article | undefined {
  return ARTICLES.find(
    (article) => article.section === section && article.slug === slug
  )
}

export function getArticles(section: ArticleSection): Article[] {
  return ARTICLES.filter((article) => article.section === section)
}
