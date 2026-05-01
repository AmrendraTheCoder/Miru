/**
 * Miru Blog Data
 * Central source of truth for all blog content.
 * Each blog has exactly 5 sections with unique titles per blog.
 */

export const blogs = [
  {
    id: "blog-001",
    headline: "Why Most Startups Fail Before Product-Market Fit",
    description:
      "The graveyard of startups is full of great ideas that never found their people. This blog breaks down the real reasons founders lose the race before they even know they're in one.",
    image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&auto=format&fit=crop&q=80",
    sections: [
      {
        title: "The Illusion of Traction",
        content:
          "Early signups, waitlist numbers, and social media buzz can all feel like validation — but they rarely are. Vanity metrics seduce founders into thinking they have something before real users have paid, returned, or recommended the product. True traction is retention, not registration. Most startups collapse here because they optimize for the wrong signal at the most critical stage.",
        readTimeMinutes: 3,
      },
      {
        title: "When Founders Fall in Love With Their Solution",
        content:
          "The moment a founder stops listening to users and starts defending their product is the moment the startup begins dying. Solution attachment is one of the most common and least discussed killers. It causes teams to rationalize bad feedback, ignore churn signals, and keep building features nobody asked for — all while the runway disappears.",
        readTimeMinutes: 3,
      },
      {
        title: "The Runway Miscalculation Problem",
        content:
          "Most early-stage founders dramatically underestimate burn and overestimate how quickly they'll hit milestones. Eighteen months of runway becomes eight once hiring, tooling, and unexpected legal or operational costs are factored in. Planning for the optimistic scenario instead of the realistic one is a structural mistake that kills companies that could have survived with tighter financial discipline.",
        readTimeMinutes: 2,
      },
      {
        title: "Team Fractures Under Pressure",
        content:
          "Co-founder conflict is the second leading cause of early startup death, and it almost always surfaces during a hard moment — a failed launch, a missed funding round, a pivot. Equity splits decided in excitement, unclear role boundaries, and mismatched risk tolerance are landmines set at founding that detonate six to eighteen months later when things get difficult.",
        readTimeMinutes: 3,
      },
      {
        title: "How to Actually Find Product-Market Fit",
        content:
          "PMF is not a eureka moment — it's a gradual tightening of signal. You feel it when retention curves flatten, when users get upset at the idea of losing your product, when growth happens without you pushing it. The path there is relentless qualitative research, fast iteration cycles, and the willingness to kill your original idea if the data demands it. Most founders know this but don't do it.",
        readTimeMinutes: 4,
      },
    ],
  },

  {
    id: "blog-002",
    headline: "The Quiet Rise of B2B SaaS in Emerging Markets",
    description:
      "While Silicon Valley obsesses over consumer apps, a generation of B2B SaaS founders in India, Southeast Asia, and Africa are building quietly profitable businesses the world hasn't noticed yet.",
    image: "https://images.unsplash.com/photo-1526628953301-3cd4e45a2b3d?w=800&auto=format&fit=crop&q=80",
    sections: [
      {
        title: "Why Emerging Markets Are a SaaS Goldmine Right Now",
        content:
          "SMBs in emerging markets are digitizing at a pace that's outrunning local software supply. Legacy tools built for Western enterprise workflows don't fit the operational realities of a logistics company in Lagos or a textile manufacturer in Surat. This gap is enormous, and the founders who grew up around these industries are uniquely positioned to fill it — at price points that still generate strong margins.",
        readTimeMinutes: 3,
      },
      {
        title: "The Unit Economics That VCs Are Overlooking",
        content:
          "Customer acquisition costs in emerging markets are a fraction of what they are in the US. A well-run B2B SaaS in India can acquire a paying SMB customer for under $50 through WhatsApp-based sales, local field reps, and referral networks. Combined with annual contracts and low churn in sticky verticals like payroll, inventory, and compliance, the LTV:CAC ratios are extraordinary — often better than celebrated Western SaaS companies.",
        readTimeMinutes: 3,
      },
      {
        title: "Distribution Is the Real Moat",
        content:
          "In these markets, product alone does not win. The founder who has relationships with industry associations, who can get into a trade fair, who has a cousin running a chain of pharmacies — that person has a distribution advantage no amount of venture funding can replicate quickly. The best emerging market SaaS companies are built on trust networks first, software second.",
        readTimeMinutes: 2,
      },
      {
        title: "Challenges That Don't Show Up in the Pitch Deck",
        content:
          "Payment infrastructure inconsistency, internet reliability in tier-2 and tier-3 cities, switching resistance from Excel and WhatsApp, and the difficulty of hiring strong product engineers outside major metros are all real and persistent friction points. The founders succeeding here aren't ignoring these — they're building around them, with offline modes, UPI-native billing flows, and WhatsApp-first onboarding.",
        readTimeMinutes: 3,
      },
      {
        title: "What Global Investors Are Starting to Figure Out",
        content:
          "A handful of global funds — Sequoia's India arm, Tiger, Lightspeed — figured this out years ago. Now a second wave of conviction is building, driven by exits like Zoho, Freshworks, and Chargebee that proved the model works. The next five years will see significantly more capital chasing emerging market B2B SaaS, and the founders who are already at scale will be the ones who benefit most.",
        readTimeMinutes: 3,
      },
    ],
  },

  {
    id: "blog-003",
    headline: "Fundraising Has Changed. Most Founders Haven't Caught Up.",
    description:
      "The playbook that worked in 2021 is actively hurting founders in 2024. Here's what the current fundraising environment actually looks like, and how to navigate it without burning your credibility.",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=80",
    sections: [
      {
        title: "The 2021 Hangover and What It Did to Investor Psychology",
        content:
          "The zero-interest-rate era created a generation of founders who were taught that growth at any cost was the strategy. When rates rose and liquidity tightened, the entire VC ecosystem overcorrected. Investors who were writing checks in two meetings now want six months of relationship-building, audited financials, and a path to profitability before a Series A. Understanding this psychological shift is step one to fundraising effectively today.",
        readTimeMinutes: 3,
      },
      {
        title: "Why Your Deck Is Probably the Wrong Priority",
        content:
          "Founders spend weeks perfecting decks and pitch narratives when the actual unlock is warm introductions and investor relationships built before you need the money. A mediocre deck from a trusted source gets a meeting. A perfect deck cold-emailed into an inbox gets deleted. The meta-skill of modern fundraising is building the network before the raise, not during it.",
        readTimeMinutes: 2,
      },
      {
        title: "The Metrics That Actually Matter to Investors Right Now",
        content:
          "Revenue quality has replaced revenue quantity as the primary signal. Investors want to see net revenue retention above 110%, CAC payback under 18 months, and gross margins that support a path to profitability. ARR growth matters, but ARR growth with deteriorating unit economics is actively penalized now where it was once overlooked. Know your numbers at this level of precision before you open any conversation.",
        readTimeMinutes: 4,
      },
      {
        title: "Seed Is the New Series A — And That's a Problem",
        content:
          "The bar for seed funding has quietly risen to where Series A expectations were three years ago. Many pre-seed and seed rounds now require meaningful revenue, a live product with retention data, and a team with prior startup experience. First-time founders without warm networks and early traction are finding it exceptionally hard. Grants, revenue-based financing, and angel syndicates have become critical alternative entry points.",
        readTimeMinutes: 3,
      },
      {
        title: "How to Run a Fundraise That Doesn't Destroy Your Company",
        content:
          "A fundraise that drags on past four months starts to damage morale, distract the founding team, and signal weakness to investors who talk to each other. Time-boxing the raise, creating competitive tension through parallel conversations, and being willing to take a smaller check from a better partner over a larger check from a misaligned one are the disciplines that separate founders who close quickly from those who don't close at all.",
        readTimeMinutes: 3,
      },
    ],
  },

  {
    id: "blog-004",
    headline: "AI Wrappers Are Not a Business. Here's What Is.",
    description:
      "Everyone is shipping GPT-powered tools and calling it a startup. A very small number of them will survive. This blog explains the difference between a feature and a defensible AI company.",
    image: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&auto=format&fit=crop&q=80",
    sections: [
      {
        title: "What an AI Wrapper Actually Is (And Why It's Fragile)",
        content:
          "An AI wrapper is a product whose core value is entirely dependent on a foundation model with a thin layer of prompt engineering and UI on top. The problem isn't that wrappers are bad products — many are genuinely useful. The problem is that they have near-zero defensibility. When OpenAI or Anthropic ships a new model version or a native feature, wrappers built on the previous capability gap evaporate overnight.",
        readTimeMinutes: 3,
      },
      {
        title: "The Proprietary Data Moat",
        content:
          "The most defensible AI companies being built right now are the ones accumulating proprietary data that makes their models meaningfully better than anything a competitor could build by fine-tuning a public model on public data. This means building products that generate valuable training signal as a byproduct of usage — legal AI that learns from firm-specific precedent, medical AI that learns from anonymized patient workflows, sales AI that learns from a company's actual win/loss history.",
        readTimeMinutes: 4,
      },
      {
        title: "Workflow Depth as a Defensibility Strategy",
        content:
          "Another class of defensible AI company wins not through better models but through deeper workflow integration. When your tool is embedded in the daily operational process of a team — when switching away means rebuilding muscle memory, retraining staff, and migrating years of structured data — you have a moat that has nothing to do with AI and everything to do with distribution and integration depth. The AI is the entry point; the workflow lock-in is the business.",
        readTimeMinutes: 3,
      },
      {
        title: "The Fine-Tuning and Compound Intelligence Play",
        content:
          "A smaller number of teams are building genuine model-layer advantages through fine-tuning on domain-specific datasets, RLHF pipelines trained on expert feedback, and compound AI architectures that combine retrieval, reasoning, and action in ways that general-purpose models handle poorly. This is expensive and technically demanding, but it produces the kind of performance gap that makes enterprise buyers sign multi-year contracts.",
        readTimeMinutes: 3,
      },
      {
        title: "How to Honestly Evaluate Whether You're Building a Business",
        content:
          "Ask yourself: if OpenAI ships this as a native feature tomorrow, does my company still exist? If the answer is no, you are building on rented land. The founders building real AI businesses can answer yes — because their moat is the data they've collected, the workflows they've displaced, the enterprise relationships they've built, or the domain-specific model performance nobody else can replicate cheaply. That's the bar. It's higher than it was eighteen months ago.",
        readTimeMinutes: 3,
      },
    ],
  },

  {
    id: "blog-005",
    headline: "The Founder's Guide to Not Burning Out Before Year Two",
    description:
      "Burnout doesn't announce itself. It builds quietly while you're shipping, fundraising, and telling everyone you're fine. This blog is about catching it before it catches you.",
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80",
    sections: [
      {
        title: "Why Founders Are Structurally Wired for Burnout",
        content:
          "The personality traits that make someone start a company — high agency, obsessive focus, tolerance for uncertainty, identity fusion with work — are the same traits that make burnout almost inevitable without deliberate intervention. Founders don't have managers, performance reviews, or enforced vacation. The only person who can set a limit is the same person who is rewarded every day for ignoring limits. This is the structural trap.",
        readTimeMinutes: 3,
      },
      {
        title: "The Early Warning Signs That Are Easy to Rationalize",
        content:
          "Reduced creativity disguised as being realistic. Irritability framed as high standards. Declining interest in the problem space written off as a rough week. Social withdrawal justified as deep focus. Burnout is masterful at borrowing the language of productivity to hide itself. The signal to watch for is not a dramatic breakdown — it's a slow, consistent reduction in the quality of your thinking and the warmth of your relationships.",
        readTimeMinutes: 3,
      },
      {
        title: "What Recovery Actually Looks Like (It's Not a Vacation)",
        content:
          "A week off does not undo six months of chronic stress. Real recovery requires structural changes to how work is organized — delegation that actually sticks, decision-making frameworks that reduce cognitive load, and the creation of genuine non-negotiable recovery time that is protected from the company's needs. Vacation is maintenance. Recovery is reconstruction. Most burned-out founders try maintenance when they need reconstruction.",
        readTimeMinutes: 3,
      },
      {
        title: "Building a Company That Doesn't Require Your Sacrifice",
        content:
          "The romanticization of founder suffering is one of the most damaging myths in startup culture. Companies built on the founder's martyrdom are fragile — they depend on one person's unsustainable output and create cultures that normalize dysfunction. The founders who build enduring companies design themselves out of single points of failure early, hire for autonomy, and measure their own performance partly by how well the company runs when they step away.",
        readTimeMinutes: 4,
      },
      {
        title: "The Practices That Founders Who Last Actually Use",
        content:
          "Not motivational — operational. A hard stop time three days a week. A co-founder or therapist or board member they tell the truth to. A physical practice that is non-negotiable regardless of launch timelines. A monthly review of whether the work still feels meaningful, not just urgent. None of this is glamorous. All of it is what separates the founders who are still standing in year five from the ones who sold, quit, or collapsed somewhere in year two.",
        readTimeMinutes: 3,
      },
    ],
  },
];

// Legacy export alias — keeps old imports working during transition
export const dummyBlogs = blogs;
