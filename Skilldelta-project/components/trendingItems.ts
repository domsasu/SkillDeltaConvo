/** Shared catalog for Home “Trending now” and Skill Gap contextual upsell. */
export type TrendingCourseItem = {
  title: string;
  provider: string;
  /** e.g. "2 hrs", "4–6 weeks" — shown before product type in course rows. */
  timeCommitment: string;
  /** Approximate total effort in minutes; used to sort skill-gap suggestions (shortest first). */
  durationMinutes?: number;
  type: string;
  rating: number;
  image: string;
};

export const trendingItems: {
  mostPopular: TrendingCourseItem[];
  weeklySpotlight: TrendingCourseItem[];
  earnDegree: TrendingCourseItem[];
} = {
  mostPopular: [
    {
      title: 'Google AI Essentials',
      provider: 'Google',
      timeCommitment: '3 months',
      type: 'Specialization',
      rating: 4.9,
      image:
        'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=128&h=128',
    },
    {
      title: 'Agentic AI and AI Agents',
      provider: 'Microsoft',
      timeCommitment: '5 weeks',
      type: 'Course',
      rating: 4.9,
      image:
        'https://images.unsplash.com/photo-1515879218367-8466d910auj7?auto=format&fit=crop&q=80&w=128&h=128',
    },
    {
      title: 'Agentic AI and AI Agents',
      provider: 'Meta',
      timeCommitment: '5 weeks',
      type: 'Course',
      rating: 4.9,
      image:
        'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&q=80&w=128&h=128',
    },
  ],
  weeklySpotlight: [
    {
      title: 'Successful Negotiation: Essential',
      provider: 'IBM',
      timeCommitment: '2 months',
      type: 'Specialization',
      rating: 4.9,
      image:
        'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=128&h=128',
    },
    {
      title: 'Successful Negotiation: Essential',
      provider: 'IBM',
      timeCommitment: '6 months',
      type: 'Professional Certificate',
      rating: 4.9,
      image:
        'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=128&h=128',
    },
    {
      title: 'Successful Negotiation: Essential',
      provider: 'Google',
      timeCommitment: '5 months',
      type: 'Professional Certificate',
      rating: 4.9,
      image:
        'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=128&h=128',
    },
  ],
  earnDegree: [
    {
      title: 'Excel Skills for Business',
      provider: 'University of Illinois',
      timeCommitment: '4 months',
      type: 'Specialization',
      rating: 4.9,
      image:
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=128&h=128',
    },
    {
      title: 'Prompt Engineering for ChatGPT',
      provider: 'IBM',
      timeCommitment: '3 weeks',
      type: 'Course',
      rating: 4.9,
      image:
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=128&h=128',
    },
    {
      title: 'Strategic Leadership and...',
      provider: 'Macquarie University',
      timeCommitment: '6 weeks',
      type: 'Course',
      rating: 4.9,
      image:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=128&h=128',
    },
  ],
};
