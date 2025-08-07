import { Github, Mail, Users } from 'lucide-react';

const Maker = () => {
  const makers = [
    {
      id: 1,
      name: 'Alex Chen',
      role: 'Full Stack Developer',
      image: '/man-1.png',
      bio: 'Passionate about building scalable web applications and creating seamless user experiences. Loves working with modern technologies and solving complex problems.',
      github: 'https://github.com',
      x: 'https://x.com',
      email: 'alex@ytclipper.com',
    },
    {
      id: 2,
      name: 'Sarah Kim',
      role: 'Full Stack Developer',
      image: '/man-1.png',
      bio: 'Focused on modern web technologies and creating intuitive interfaces that users love. Expert in frontend development and user experience design.',
      github: 'https://github.com',
      x: 'https://x.com',
      email: 'sarah@ytclipper.com',
    },
  ];

  return (
    <section
      id='maker'
      className='py-20 bg-gradient-to-br from-orange-50 via-white to-orange-100'
    >
      <div className='max-w-7xl mx-auto px-6 lg:px-8'>
        {/* Header */}
        <div className='text-center mb-16'>
          <div className='inline-flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full mb-6'>
            <Users className='w-4 h-4 text-orange-600' />
            <span className='text-sm font-medium text-orange-700'>
              Meet the Team
            </span>
          </div>

          <h2 className='text-3xl lg:text-5xl font-bold text-gray-900 mb-4'>
            Built by
            <span className='bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent'>
              {' '}
              Amazing
            </span>
            <br />
            Developers
          </h2>

          <p className='text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-tight'>
            The talented minds behind YT Clipper, crafting exceptional
            experiences with passion and expertise.
          </p>
        </div>

        {/* Maker Cards */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-8xl mx-auto'>
          {makers.map((maker) => (
            <div
              key={maker.id}
              className='group relative bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 overflow-hidden h-44 md:h-72'
            >
              {/* Background decoration */}
              <div className='absolute -inset-4 bg-gradient-to-r from-orange-100 to-orange-50 rounded-3xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-500' />

              {/* Card Content */}
              <div className='relative h-full flex'>
                {/* Image Section - Half Width, Full Height */}
                <div className='w-[40%] md:w-1/2 h-full relative'>
                  <img
                    src={maker.image}
                    alt={maker.name}
                    className='w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500'
                  />
                </div>

                {/* Content Section - Half Width */}
                <div className='w-[60%] md:w-1/2 h-full p-6 flex flex-col justify-center'>
                  {/* Name and Role */}
                  <div className='mb-2 lg:mb-4'>
                    <h3 className='text-lg md:text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors duration-300 mb-2'>
                      {maker.name}
                    </h3>
                    <div className='inline-flex items-center gap-2 px-2 py-1 bg-orange-50 border border-orange-200 rounded-full'>
                      <span className='text-xs md:text-sm font-medium text-orange-700'>
                        {maker.role}
                      </span>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className='text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3'>
                    {maker.bio}
                  </p>

                  {/* Social Links */}
                  <div className='flex items-center gap-3'>
                    <a
                      href={maker.github}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='w-10 h-10 bg-gray-100 hover:bg-orange-100 border border-gray-200 hover:border-orange-200 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110'
                    >
                      <Github className='w-4 h-4 text-gray-600 group-hover:text-orange-600 transition-colors' />
                    </a>
                    <a
                      href={maker.x}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='w-10 h-10 bg-gray-100 hover:bg-orange-100 border border-gray-200 hover:border-orange-200 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110'
                    >
                      <svg
                        className='w-4 h-4 text-gray-600 group-hover:text-orange-600 transition-colors'
                        viewBox='0 0 24 24'
                        fill='currentColor'
                      >
                        <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
                      </svg>
                    </a>
                    <a
                      href={`mailto:${maker.email}`}
                      className='w-10 h-10 bg-gray-100 hover:bg-orange-100 border border-gray-200 hover:border-orange-200 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110'
                    >
                      <Mail className='w-4 h-4 text-gray-600 group-hover:text-orange-600 transition-colors' />
                    </a>
                  </div>
                </div>
              </div>

              {/* Hover effect overlay */}
              <div className='absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl' />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Maker;
