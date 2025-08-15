import type { MostUsedTag } from '@/services/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@ytclipper/ui';
import { Hash } from 'lucide-react';

interface MostUsedTagsProps {
  tags: MostUsedTag[];
}

export const MostUsedTags = ({ tags }: MostUsedTagsProps) => {
  return (
    <Card className='shadow-sm border-0 bg-white'>
      <CardHeader className='pb-3'>
        <CardTitle className='flex items-center gap-2 text-lg font-semibold text-gray-900'>
          <Hash className='w-5 h-5 text-orange-600' />
          Most Used Tags
        </CardTitle>
      </CardHeader>
      <CardContent className='pt-0'>
        <div className='flex flex-wrap gap-2'>
          {tags.map((tag) => (
            <span
              key={tag.name}
              className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors cursor-pointer'
            >
              {tag.name} ({tag.count})
            </span>
          ))}
          {tags.length === 0 && (
            <p className='text-gray-500 text-sm'>No tags used yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
