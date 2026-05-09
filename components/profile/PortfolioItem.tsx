import type { PortfolioItem as PortfolioItemType } from '@/lib/types';

interface PortfolioItemProps {
  item: PortfolioItemType;
  onDelete?: (id: string) => void;
  isOwner?: boolean;
}

export function PortfolioItem({ item, onDelete, isOwner = false }: PortfolioItemProps) {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-3 md:p-4 space-y-2 md:space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-1 md:space-y-2 flex-1">
          <h3 className="font-medium text-[#F8FAFC] text-sm md:text-base">{item.title}</h3>
          
          {item.description && (
            <p className="text-[#94A3B8] text-xs md:text-sm">{item.description}</p>
          )}

          <div className="flex flex-wrap gap-1 md:gap-2">
            {item.image_url && (
              <a
                href={item.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 hover:underline text-xs md:text-sm"
              >
                View Image
              </a>
            )}
            
            {item.link_url && (
              <a
                href={item.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 hover:underline text-xs md:text-sm"
              >
                Visit Link
              </a>
            )}
          </div>
        </div>

        {isOwner && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="text-red-400 hover:text-red-300 text-xs md:text-sm"
          >
            Delete
          </button>
        )}
      </div>

      <div className="text-gray-500 text-xs">
        Added {new Date(item.created_at).toLocaleDateString()}
      </div>
    </div>
  );
}