import { ChevronDown, HelpCircle } from 'lucide-react';
import { useState } from 'react';

const Faq = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // FAQ data - easy to modify
  const faqs = [
    {
      question: 'How does YT Clipper work?',
      answer:
        'YT Clipper seamlessly integrates with YouTube videos, allowing you to add timestamped notes, create chapters, and organize your learning content. Simply paste a YouTube URL, and our AI-powered system helps you create professional video chapters and insights.',
    },
    {
      question: 'Is YT Clipper free to use?',
      answer:
        'Yes! YT Clipper offers a generous free tier that includes basic features like video integration, timestamp creation, and note-taking. We also offer premium plans with advanced features like AI insights, unlimited storage, and collaborative tools.',
    },
    {
      question: 'Can I share my clips with others?',
      answer:
        'Absolutely! YT Clipper makes sharing effortless. You can create shareable links to your clips and notes, collaborate with team members, and even embed your organized content directly into presentations or websites.',
    },
    {
      question: 'What video platforms are supported?',
      answer:
        "Currently, YT Clipper is optimized for YouTube videos. We're actively working on expanding support to other major video platforms like Vimeo, Twitch, and educational platforms to provide a comprehensive learning solution.",
    },
    {
      question: 'How accurate are the AI-generated insights?',
      answer:
        'Our AI system has been trained on millions of educational videos and provides highly accurate insights. It can identify key topics, suggest relevant timestamps, and generate summaries with over 95% accuracy. You can always edit or customize any AI-generated content.',
    },
    {
      question: 'Can I use YT Clipper for team collaboration?',
      answer:
        'Yes! YT Clipper supports team collaboration with features like shared workspaces, real-time editing, and permission management. Perfect for educational institutions, content teams, and learning groups who want to organize and share knowledge effectively.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id='faq'
      className='py-24 bg-gradient-to-b from-gray-50/50 to-white'
    >
      <div className='max-w-4xl mx-auto px-6 lg:px-8'>
        {/* Section Header */}
        <div className='text-center mb-16'>
          {/* Badge */}
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full mb-6'>
            <HelpCircle className='w-4 h-4 text-orange-600' />
            <span className='text-sm font-medium text-orange-700'>
              Frequently Asked Questions
            </span>
          </div>

          {/* Main Heading */}
          <h2 className='text-3xl lg:text-5xl font-bold text-gray-900 mb-6'>
            Everything you need to
            <span className='bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent'>
              {' '}
              know
            </span>
          </h2>

          {/* Subtitle */}
          <p className='text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-tight'>
            Get answers to the most common questions about YT Clipper and how it
            can transform your learning experience.
          </p>
        </div>

        {/* FAQ Items */}
        <div className='space-y-3'>
          {faqs.map((faq, index) => (
            <div
              key={faq.question}
              className='group bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-lg'
            >
              {/* Question Button */}
              <button
                onClick={() => toggleFaq(index)}
                className='w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50/30 transition-all duration-200'
              >
                <h3 className='text-base lg:text-lg font-semibold text-gray-900 pr-4'>
                  {faq.question}
                </h3>
                <div
                  className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                  transition-all duration-300 group-hover:bg-orange-50
                  ${openIndex === index ? 'bg-orange-50 rotate-180' : 'bg-gray-50'}
                `}
                >
                  <ChevronDown
                    className={`
                    w-5 h-5 transition-all duration-300
                    ${openIndex === index ? 'text-orange-600' : 'text-gray-500 group-hover:text-orange-600'}
                  `}
                  />
                </div>
              </button>

              {/* Answer Panel */}
              <div
                className={`
                overflow-hidden transition-all duration-500 ease-in-out
                ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
              `}
              >
                <div className='px-8 pb-6'>
                  <div className='pt-2 border-t border-gray-100'>
                    <p className='text-gray-600 leading-relaxed text-base lg:text-lg'>
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Faq;
