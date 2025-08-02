import { Card, CardContent, CardHeader, Skeleton } from '@ytclipper/ui';

export const ProfileLoader = () => {
  return (
    <div className='min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 py-8'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center mb-8'>
          <Skeleton className='h-8 w-24' />
          <div className='flex space-x-4'>
            <Skeleton className='h-10 w-32' />
            <Skeleton className='h-10 w-20' />
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          <div className='lg:col-span-2 space-y-6'>
            <Card className='shadow-lg border-0 bg-white/80 backdrop-blur-sm'>
              <CardHeader>
                <div className='flex items-center gap-2'>
                  <Skeleton className='w-5 h-5 rounded' />
                  <Skeleton className='h-6 w-32' />
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex justify-center lg:justify-start'>
                    <Skeleton className='w-20 h-20 rounded-full' />
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {Array.from({ length: 5 })
                      .map((_, idx) => idx)
                      .map((id) => (
                        <div key={id} className='flex items-center gap-2'>
                          <Skeleton className='h-4 w-20 mb-2' />
                          <Skeleton className='h-4 w-32' />
                        </div>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className='shadow-lg border-0 bg-white/80 backdrop-blur-sm'>
              <CardHeader>
                <div className='flex items-center gap-2'>
                  <Skeleton className='w-5 h-5 rounded' />
                  <Skeleton className='h-6 w-36' />
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg border border-orange-200'>
                    <div className='flex items-center gap-3'>
                      <Skeleton className='w-6 h-6 rounded' />
                      <div>
                        <Skeleton className='h-5 w-24 mb-1' />
                        <Skeleton className='h-4 w-16' />
                      </div>
                    </div>
                    <div className='text-right'>
                      <Skeleton className='h-4 w-16 mb-1' />
                      <Skeleton className='h-4 w-20' />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <Skeleton className='h-5 w-24' />
                    <div className='space-y-1'>
                      {Array.from({ length: 5 })
                        .map((_, idx) => idx)
                        .map((id) => (
                          <div key={id} className='flex items-center gap-2'>
                            <Skeleton className='w-4 h-4 rounded' />
                            <Skeleton className='h-4 w-48' />
                          </div>
                        ))}
                    </div>
                  </div>

                  <Skeleton className='h-10 w-full' />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className='lg:col-span-1'>
            <Card className='shadow-lg border-0 bg-white/80 backdrop-blur-sm'>
              <CardHeader>
                <div className='flex items-center gap-2'>
                  <Skeleton className='w-5 h-5 rounded' />
                  <Skeleton className='h-6 w-40' />
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                    <div className='flex items-center space-x-2'>
                      <Skeleton className='w-5 h-5 rounded' />
                      <Skeleton className='h-4 w-16' />
                    </div>
                    <Skeleton className='h-6 w-20 rounded-full' />
                  </div>

                  <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                    <div className='flex items-center space-x-2'>
                      <Skeleton className='w-5 h-5 rounded' />
                      <Skeleton className='h-4 w-20' />
                    </div>
                    <Skeleton className='h-6 w-16 rounded-full' />
                  </div>

                  <div className='pt-4 border-t border-gray-200'>
                    <Skeleton className='h-10 w-full' />
                    <Skeleton className='h-3 w-48 mx-auto mt-2' />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
