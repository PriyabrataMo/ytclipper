import { Mail, MessageSquare, Send, User } from 'lucide-react';
import React, { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);

    // Reset form
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: '',
    });
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      details: 'hello@ytclipper.com',
      description: "We'll respond within 24 hours",
    },
  ];

  return (
    <section
      id='contact'
      className='min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center py-16'
    >
      <div className='max-w-6xl mx-auto px-6 lg:px-8 w-full'>
        {/* Section Header */}
        <div className='text-center mb-12'>
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full mb-6'>
            <MessageSquare className='w-4 h-4 text-orange-600' />
            <span className='text-sm font-medium text-orange-700'>
              Get In Touch
            </span>
          </div>

          <h2 className='text-3xl lg:text-5xl font-bold text-gray-900 mb-4'>
            Let&apos;s start a
            <span className='bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent'>
              {' '}
              conversation
            </span>
          </h2>

          <p className='text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-tight'>
            Have questions about YT Clipper? We&apos;d love to hear from you.
            Send us a message and we&apos;ll respond as soon as possible.
          </p>
        </div>

        <div className='grid lg:grid-cols-2 gap-10 lg:gap-16'>
          {/* Left Side - Contact Info */}
          <div className='space-y-8'>
            <div className='p-6 bg-white rounded-2xl border border-gray-100 hover:border-orange-200 transition-all duration-300 hover:shadow-lg '>
              <h3 className='text-2xl font-bold text-gray-900 mb-4'>
                Get in touch with us
              </h3>
              <p className='text-gray-600 leading-relaxed mb-8'>
                Ready to transform your learning experience? We&apos;re here to
                help you get started with YT Clipper and answer any questions
                you might have.
              </p>
            </div>

            {/* Contact Info Cards */}
            <div className='space-y-6'>
              {contactInfo.map((info) => (
                <div
                  key={info.title}
                  className='flex items-start gap-4 p-6 bg-white rounded-2xl border border-gray-100 hover:border-orange-200 transition-all duration-300 hover:shadow-lg group'
                >
                  <div className='flex-shrink-0 w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                    <info.icon className='w-6 h-6 text-white' />
                  </div>
                  <div>
                    <h4 className='font-semibold text-gray-900 mb-1'>
                      {info.title}
                    </h4>
                    <p className='text-gray-900 font-medium mb-1'>
                      {info.details}
                    </p>
                    <p className='text-gray-500 text-sm'>{info.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Features List */}
            <div className='bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200'>
              <h4 className='font-semibold text-gray-900 mb-4'>
                Why choose YT Clipper?
              </h4>
              <ul className='space-y-3 text-gray-600'>
                <li className='flex items-center gap-3'>
                  <div className='w-2 h-2 bg-orange-500 rounded-full flex-shrink-0' />
                  <span>AI-powered insights and recommendations</span>
                </li>
                <li className='flex items-center gap-3'>
                  <div className='w-2 h-2 bg-orange-500 rounded-full flex-shrink-0' />
                  <span>Seamless YouTube integration</span>
                </li>
                <li className='flex items-center gap-3'>
                  <div className='w-2 h-2 bg-orange-500 rounded-full flex-shrink-0' />
                  <span>Collaborative learning features</span>
                </li>
                <li className='flex items-center gap-3'>
                  <div className='w-2 h-2 bg-orange-500 rounded-full flex-shrink-0' />
                  <span>24/7 customer support</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Side - Contact Form */}
          <div className='bg-gradient-to-br from-gray-50 to-white rounded-3xl border-2 border-orange-100 p-8 lg:p-10 shadow-xl'>
            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Name Field */}
              <div className='space-y-2'>
                <label
                  htmlFor='name'
                  className='block text-sm font-medium text-gray-700'
                >
                  Full Name
                </label>
                <div className='relative'>
                  <User className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <input
                    type='text'
                    id='name'
                    name='name'
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className='w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white hover:bg-gray-50'
                    placeholder='Enter your full name'
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className='space-y-2'>
                <label
                  htmlFor='email'
                  className='block text-sm font-medium text-gray-700'
                >
                  Email Address
                </label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
                  <input
                    type='email'
                    id='email'
                    name='email'
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className='w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white hover:bg-gray-50'
                    placeholder='Enter your email address'
                  />
                </div>
              </div>

              {/* Subject Field */}
              <div className='space-y-2'>
                <label
                  htmlFor='subject'
                  className='block text-sm font-medium text-gray-700'
                >
                  Subject
                </label>
                <input
                  type='text'
                  id='subject'
                  name='subject'
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className='w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white hover:bg-gray-50'
                  placeholder="What's this about?"
                />
              </div>

              {/* Message Field */}
              <div className='space-y-2'>
                <label
                  htmlFor='message'
                  className='block text-sm font-medium text-gray-700'
                >
                  Message
                </label>
                <textarea
                  id='message'
                  name='message'
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className='w-full px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-white hover:bg-gray-50 resize-y'
                  placeholder='Tell us more about your inquiry...'
                />
              </div>

              {/* Submit Button */}
              <button
                type='submit'
                disabled={isSubmitting}
                className='w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2'
              >
                {isSubmitting ? (
                  <>
                    <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    Sending Message...
                  </>
                ) : (
                  <>
                    <Send className='w-5 h-5' />
                    Send Message
                  </>
                )}
              </button>

              {/* Privacy Notice */}
              <p className='text-xs text-gray-500 text-center'>
                By submitting this form, you agree to our{' '}
                <button
                  type='button'
                  className='text-orange-600 hover:text-orange-700 underline font-medium'
                  onClick={() => window.open('/privacy', '_blank')}
                >
                  Privacy Policy
                </button>{' '}
                and{' '}
                <button
                  type='button'
                  className='text-orange-600 hover:text-orange-700 underline font-medium'
                  onClick={() => window.open('/terms', '_blank')}
                >
                  Terms of Service
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
