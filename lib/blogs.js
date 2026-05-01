export const blogOptions = [
  { id: "key-takeaways", label: "Key Takeaways" },
  { id: "deep-dive", label: "Deep Dive" },
  { id: "founder-insights", label: "Founder Insights" },
  { id: "market-data", label: "Market Data" },
  { id: "actionable-tips", label: "Actionable Tips" },
  { id: "summary", label: "Summary" }
];

export const dummyBlogs = [
  {
    id: "cracking-stripe-pm",
    headline: "How to crack product interviews at Stripe and Airbnb",
    description: "A comprehensive guide dropping the playbook on what top-tier startups look for in product talent.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
    sections: [
      {
        id: "key-takeaways",
        readTime: 2,
        content: `### Key Takeaways
- Stripe indexes heavily on API design thinking and developer empathy.
- Airbnb focuses on "11-star experiences" and deep user centricity.
- Execution and metrics matter, but craft and taste are the tie-breakers.`
      },
      {
        id: "deep-dive",
        readTime: 6,
        content: `### Deep Dive: The Product Sense Interview
When interviewing at Stripe, product sense means understanding the abstraction layer. You aren't just building a feature; you are designing a primitive that thousands of developers will use to build their own features.
At Airbnb, product sense is often evaluated through the lens of a "journey." How does the user feel at each step? What is the offline experience that matches the online booking?

**Framework for Answering:**
1. Identify the core primitive or user journey.
2. Outline the constraints (technical, operational, emotional).
3. Design the ideal state (the 11-star experience).
4. Scope it back to a V1.`
      },
      {
        id: "founder-insights",
        readTime: 3,
        content: `### Founder Insights
Patrick Collison often speaks about the importance of writing well. Stripe's culture is heavily documented. If you can't write a crisp, one-page strategy memo, you will struggle to influence the product direction.

Brian Chesky emphasizes design as a fundamental business advantage. It's not just how it looks, but how it works and how it makes people feel.`
      },
      {
        id: "actionable-tips",
        readTime: 3,
        content: `### Actionable Tips
- **Write a mock PRD:** Before your interview, write a 1-page PRD for a feature you think Stripe or Airbnb should build. Send it to your recruiter or use it as a talking point.
- **Read the Docs:** For Stripe, literally read their API documentation. Understand how they structure objects and events.
- **Study the App:** For Airbnb, book a cheap experience locally and document every step of the funnel.`
      },
      {
        id: "summary",
        readTime: 1,
        content: `### Summary
Cracking top-tier product interviews requires shifting your mindset from "feature building" to "system design" and "experience crafting." Prepare deeply, write clearly, and always ground your ideas in user empathy.`
      }
    ]
  },
  {
    id: "funding-landscape-2025",
    headline: "Miru Insights: Breaking down the 2025 startup funding landscape",
    description: "An analytical deep dive into where venture capital is flowing this year, heavily focused on AI and deep tech.",
    image: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&q=80&w=800",
    sections: [
      {
        id: "key-takeaways",
        readTime: 1,
        content: `### Key Takeaways
- AI infrastructure companies are capturing 40% of Series A funding.
- Consumer social is experiencing a micro-revival.
- Valuations have stabilized to 2019 levels.`
      },
      {
        id: "market-data",
        readTime: 5,
        content: `### Market Data
The median seed round in Q1 2025 sits at $3.2M on a $15M post-money valuation. While this is down from the 2021 peaks, it represents a healthy normalization. Interestingly, the time-to-close for top quartile deals has actually accelerated, meaning the best companies are still raising in less than 3 weeks.

**Sector Breakdown:**
- AI/ML Models & Infra: 38%
- Vertical SaaS: 22%
- Climate Tech: 15%
- Fintech: 12%
- Other: 13%`
      },
      {
        id: "deep-dive",
        readTime: 4,
        content: `### Deep Dive: The Rise of Vertical AI
General purpose LLMs are becoming commoditized. The real value is shifting towards companies that combine proprietary datasets with specialized models to solve very specific workflow problems. Think "AI for dental practice management" or "AI for autonomous drone surveying." Investors are looking for high ACVs and sticky workflows.`
      },
      {
        id: "summary",
        readTime: 1,
        content: `### Summary
The 2025 funding landscape rewards pragmatism and clear paths to profitability. AI remains the dominant narrative, but the focus has shifted from foundation models to applied, vertical solutions.`
      }
    ]
  },
  {
    id: "product-vs-service",
    headline: "Product vs Service companies: what students need to know",
    description: "Before placement season, understand the fundamental differences in career trajectory, compensation, and work-life balance.",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
    sections: [
      {
        id: "key-takeaways",
        readTime: 2,
        content: `### Key Takeaways
- Product companies build IP; Service companies bill hours.
- Compensation structures vary wildly (stock options vs variable pay).
- Skill acquisition arcs differ (depth vs breadth).`
      },
      {
        id: "deep-dive",
        readTime: 5,
        content: `### Deep Dive: The Career Arc
**Product Companies:** You will likely spend months or years working on a single product. You will learn how to scale systems, handle edge cases, and iterate based on user feedback. The depth of knowledge you acquire is significant.
**Service Companies:** You will jump between projects every 3-6 months. You will learn how to quickly adapt to new tech stacks, manage client expectations, and deliver MVPs under tight deadlines. The breadth of knowledge is significant.`
      },
      {
        id: "actionable-tips",
        readTime: 2,
        content: `### Actionable Tips for Placement Season
- **If aiming for Product:** Focus heavily on Data Structures, Algorithms, and System Design. Build side projects that solve real problems.
- **If aiming for Service:** Focus on mastering popular frameworks (React, Spring Boot, etc.), build a diverse portfolio, and practice your communication and client-facing skills.`
      },
      {
        id: "summary",
        readTime: 1,
        content: `### Summary
Neither path is objectively better. Choose a product company if you want depth and equity upside. Choose a service company if you want variety and rapid exposure to different industries.`
      }
    ]
  },
  {
    id: "yc-w25-analysis",
    headline: "YC W25 batch analysis — which companies are hiring interns?",
    description: "We parsed the latest YC batch to find the hidden gems actively recruiting university talent for the summer.",
    image: "https://images.unsplash.com/photo-1556761175-5973dc0f32d7?auto=format&fit=crop&q=80&w=800",
    sections: [
      {
        id: "key-takeaways",
        readTime: 1,
        content: `### Key Takeaways
- 30% of the W25 batch has active internship postings.
- Remote-first internships are the standard for software roles.
- Compensation averages $6k-$8k/month for technical roles.`
      },
      {
        id: "deep-dive",
        readTime: 6,
        content: `### Deep Dive: Who is Hiring?
The trend this year is heavily skewed towards developer tools and applied AI. Many of these startups are teams of 2-3 founders who need capable engineers to help ship product quickly. They aren't looking for standard interns; they are looking for "10x junior engineers."

**Notable Companies Hiring:**
1. **NexusDB:** Building a vector database for edge devices. (Hiring Rust engineers)
2. **Kite Health:** AI-powered medical billing. (Hiring Full-stack TS engineers)
3. **Orbit Logistics:** Autonomous warehouse routing. (Hiring ML/CV interns)`
      },
      {
        id: "actionable-tips",
        readTime: 3,
        content: `### Actionable Tips for Applying
- **Don't just send a resume.** Reach out to the founders directly on Twitter or LinkedIn.
- **Show, don't tell.** If a company is building an AI tool, build a quick prototype using their API (or a competitor's) and send them the GitHub link.
- **Emphasize velocity.** YC founders care about speed. Highlight instances where you built and shipped something incredibly fast.`
      },
      {
        id: "summary",
        readTime: 1,
        content: `### Summary
Interning at a YC startup is a high-risk, high-reward endeavor. You will work harder than you would at a big tech company, but you will learn exponentially more.`
      }
    ]
  }
];
