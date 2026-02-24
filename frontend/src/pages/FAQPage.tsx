import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function FAQPage() {
  const faqs = [
    {
      category: 'Shipping & Delivery',
      questions: [
        {
          q: 'How long does shipping take?',
          a: 'Orders are typically processed within 2-3 business days. Domestic shipping takes 5-7 business days, while international orders may take 10-14 business days.',
        },
        {
          q: 'Do you ship internationally?',
          a: 'Yes! We ship to most countries worldwide. Shipping costs and delivery times vary by location.',
        },
        {
          q: 'How can I track my order?',
          a: 'Once your order ships, you\'ll receive a tracking number via email. You can also view your order status in the "My Orders" section after logging in.',
        },
      ],
    },
    {
      category: 'Returns & Exchanges',
      questions: [
        {
          q: 'What is your return policy?',
          a: 'We accept returns within 30 days of delivery for unused items in original condition. Custom or personalized items cannot be returned unless defective.',
        },
        {
          q: 'How do I initiate a return?',
          a: 'Contact us at hello@mosslightstudios.com with your order number and reason for return. We\'ll provide you with return instructions and a prepaid shipping label.',
        },
        {
          q: 'When will I receive my refund?',
          a: 'Refunds are processed within 5-7 business days after we receive your returned item. The refund will be issued to your original payment method.',
        },
      ],
    },
    {
      category: 'Product Care',
      questions: [
        {
          q: 'How should I care for my handcrafted items?',
          a: 'Each product comes with specific care instructions. Generally, we recommend gentle handling, avoiding harsh chemicals, and storing items in a cool, dry place.',
        },
        {
          q: 'Are your products made from sustainable materials?',
          a: 'Yes! We prioritize using eco-friendly and sustainable materials whenever possible. Product descriptions include material information.',
        },
        {
          q: 'Can I request custom modifications?',
          a: 'We love custom orders! Contact us to discuss your ideas, and we\'ll work with you to create something special.',
        },
      ],
    },
    {
      category: 'Ordering & Payment',
      questions: [
        {
          q: 'What payment methods do you accept?',
          a: 'We accept all major credit cards, debit cards, and secure online payment methods through our checkout system.',
        },
        {
          q: 'Is my payment information secure?',
          a: 'Absolutely. We use industry-standard encryption and secure payment processing to protect your information.',
        },
        {
          q: 'Can I cancel or modify my order?',
          a: 'Orders can be cancelled or modified within 24 hours of placement. After that, items may already be in production. Contact us as soon as possible if you need to make changes.',
        },
      ],
    },
  ];

  return (
    <div className="container py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="font-serif text-5xl font-bold">Frequently Asked Questions</h1>
          <p className="text-lg text-muted-foreground">
            Find answers to common questions about our products and services
          </p>
        </div>

        <div className="space-y-8">
          {faqs.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-4">
              <h2 className="font-serif text-2xl font-semibold text-primary">
                {section.category}
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {section.questions.map((faq, faqIndex) => (
                  <AccordionItem key={faqIndex} value={`${sectionIndex}-${faqIndex}`}>
                    <AccordionTrigger className="text-left">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-muted/30 rounded-lg text-center">
          <h3 className="font-serif text-xl font-semibold mb-2">Still have questions?</h3>
          <p className="text-muted-foreground mb-4">
            We're here to help! Reach out to us anytime.
          </p>
          <a
            href="mailto:hello@mosslightstudios.com"
            className="text-primary hover:underline font-medium"
          >
            hello@mosslightstudios.com
          </a>
        </div>
      </div>
    </div>
  );
}
