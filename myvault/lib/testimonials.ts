import testimonialsData from '@/content/testimonials.json';

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  source: string;
}

export function getAllTestimonials(): Testimonial[] {
  return testimonialsData as Testimonial[];
}
