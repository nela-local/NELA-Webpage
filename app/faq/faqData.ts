export type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type FaqSection = {
  id: string;
  title: string;
  items: FaqItem[];
};

export const FAQ_SECTIONS: FaqSection[] = [
  {
    id: 'product',
    title: 'Product & local use',
    items: [
      {
        id: 'fully-local',
        question: 'Is NELA fully local?',
        answer:
          'Core workflows are local-first. Inference, indexing, and retrieval are designed to run on-device. Internet is mainly needed for model downloads and optional Cloud or web-search flows.',
      },
      {
        id: 'model-categories',
        question: 'Do I need every model category installed?',
        answer:
          'No. Start with one LLM for chat. Add a vision model for image tasks, TTS/ASR for audio, and embedding / classifier models if you want stronger document RAG.',
      },
      {
        id: 'modes',
        question:
          'What is the difference between Chat, Vision, Audio, Podcast, and Mindmap?',
        answer:
          'Each mode is a different task path: Chat for general text and RAG, Vision for image-grounded prompts, Audio for speech workflows, Podcast for scripted two-speaker generation, and Mindmap for concept-tree outputs.',
      },
      {
        id: 'rag-weak',
        question: 'Why are my RAG answers weak even though files are uploaded?',
        answer:
          'Confirm embedding models are installed and ingestion finished. Classifier and grader models improve retrieval quality. Rebuild the index if you changed embedding model family.',
      },
      {
        id: 'move-project',
        question: 'Can I move a project between machines?',
        answer:
          'Yes. Export your workspace as a .nela project file and import it on another machine. Model files may still need to be installed on the destination device.',
      },
      {
        id: 'model-size',
        question: 'How do I choose a model size for my hardware?',
        answer:
          'Use the compatibility hints in Settings. Smaller quantized models are faster and lighter; larger models may improve quality but need more RAM, CPU, and disk.',
      },
    ],
  },
  {
    id: 'credits',
    title: 'Credits & Cloud modes',
    items: [
      {
        id: 'what-are-credits',
        question: 'What are NELA credits?',
        answer:
          'Credits are the unit Cloud uses to meter Smart and Deep (and paid Fast usage). Each Cloud turn burns credits based on how much work the request did. Your Profile and Billing pages show balance and monthly grant.',
      },
      {
        id: 'monthly-vs-packs',
        question: 'What is the difference between monthly grants and top-up packs?',
        answer:
          'Starter and Pro subscriptions grant credits each billing period (subscription portion does not roll over). Credit packs (Nano, Plus, Max) top up the same wallet and do roll over. Both spend from one combined balance.',
      },
      {
        id: 'fast-free',
        question: 'How does the free Local & Cloud tier work?',
        answer:
          'Download NELA for free on-device modes (Fast, Smart, and Deep locally). When you sign in, Cloud Fast adds a rolling free allowance (shown on Pricing and in Cloud settings). When that window is used up, wait for it to reset, buy a pack, or subscribe for credit-backed Cloud.',
      },
      {
        id: 'smart-deep-unlock',
        question: 'How do I unlock Cloud Smart and Deep?',
        answer:
          'Smart and Deep on your device are included in the free Local & Cloud tier. On Cloud, Smart and Deep need an active Starter or Pro plan, or a credit pack with remaining balance.',
      },
      {
        id: 'upgrade-credits',
        question: 'What happens to my credits if I upgrade from Starter to Pro mid-month?',
        answer:
          'Your plan becomes Pro and your monthly grant is topped up by the difference between the Pro and Starter grants for that period. Credits you already used stay accounted for — you should not lose remaining balance from the upgrade itself.',
      },
    ],
  },
  {
    id: 'openrouter',
    title: 'OpenRouter & Cloud routing',
    items: [
      {
        id: 'what-is-or',
        question: 'What is OpenRouter’s role in NELA Cloud?',
        answer:
          'NELA Cloud routes Cloud chat through OpenRouter so you get access to a curated set of hosted models without managing provider keys yourself. Your prompts leave the device only when you choose Cloud (or Auto falls back to Cloud).',
      },
      {
        id: 'keys',
        question: 'Do I need my own OpenRouter API key?',
        answer:
          'No. Signed-in Cloud traffic uses NELA’s managed key pool. Local & Cloud on-device modes never need an OpenRouter key — models run on your machine.',
      },
      {
        id: 'private-vs-cloud',
        question: 'When should I use Private vs Cloud?',
        answer:
          'Private keeps inference on-device — best for privacy and offline work. Cloud is for when you want hosted Fast / Smart / Deep quality without loading large local models. Auto prefers Cloud when available and can fall back locally.',
      },
      {
        id: 'tools-web',
        question: 'Does Cloud use tools like web search?',
        answer:
          'Yes. When tools are enabled, Cloud can call web search and related desktop-hosted tools as part of the request. You can turn tools off in the composer when you want a plain answer.',
      },
    ],
  },
  {
    id: 'catalog',
    title: 'Model cataloging',
    items: [
      {
        id: 'how-catalog',
        question: 'How does NELA choose Cloud Fast / Smart / Deep models?',
        answer:
          'A background sweeper periodically reads OpenRouter’s public model list, filters for chat-capable models, scores them (capabilities, context, quality signals, and pricing bands), and assigns the top entries into Fast, Smart, and Deep. Caps keep each lane curated rather than listing every model OR offers.',
      },
      {
        id: 'new-models',
        question: 'When will a newly released model appear in Cloud?',
        answer:
          'Only after OpenRouter lists it. The next catalog sweep can then score and place it. Stronger models can push weaker ones out of a tier’s limited slots. Until OR publishes a model, NELA cannot route to it.',
      },
      {
        id: 'local-models',
        question: 'Does the Cloud catalog control my local models?',
        answer:
          'No. On-device modes use models you download and pick locally. The Cloud catalog only affects Fast / Smart / Deep when you are on Cloud.',
      },
      {
        id: 'why-rotate',
        question: 'Why might the Cloud model behind a mode change over time?',
        answer:
          'The catalog is living. As OpenRouter adds models, updates pricing, or quality signals shift, the sweeper re-ranks and may rotate which concrete model ids sit in each tier — while the Fast / Smart / Deep experience stays the same for you.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments & billing',
    items: [
      {
        id: 'how-pay',
        question: 'How do payments work?',
        answer:
          'Checkout is in INR via Razorpay. You can buy Starter or Pro subscriptions, or one-time credit packs. After paying, return to Billing and use Confirm if the plan or credits are not active yet.',
      },
      {
        id: 'already-subscribed',
        question: 'Can I buy Starter again if I already have Pro?',
        answer:
          'No. If you already have that plan or a higher one, checkout is blocked with a clear message. You can still upgrade from Starter to Pro, and you can always buy credit top-up packs.',
      },
      {
        id: 'manage-cancel',
        question: 'How do I cancel a subscription?',
        answer:
          'Open Account → Billing → Cancel subscription. That stops renewal at the end of the current period — you keep Premium until then. If you cancelled by mistake, use Restore subscription on the same page to undo it before the period ends. After checkout, activation is handled automatically; past purchases appear under Transactions.',
      },
      {
        id: 'packs-any-plan',
        question: 'Can I buy credit packs without a subscription?',
        answer:
          'Yes. Packs work on Free Cloud as well as on Starter / Pro. They unlock Cloud Smart and Deep while balance lasts and roll over across months.',
      },
      {
        id: 'team',
        question: 'Is there a Team or enterprise plan?',
        answer:
          'Team / Enterprise is the fourth column on Pricing (coming soon): per-seat INR pricing with shared org billing. Use Contact for Team there to register interest — checkout is not available yet.',
      },
    ],
  },
];
