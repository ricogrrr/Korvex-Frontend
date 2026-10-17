import { forwardRef, type InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../lib/cn';
import { fieldBase, fieldBorder } from '../lib/fields';
import { Icon } from './Icon';
import { IconButton } from './Button';

export interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size'> {
  value: string;
  onChange: (value: string) => void;
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { value, onChange, placeholder = 'Search', className, ...rest },
  ref,
) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <Icon icon={Search} className="pointer-events-none absolute left-3 text-fg-tertiary" />
      <input
        ref={ref}
        type="text"
        role="searchbox"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && value) {
            e.stopPropagation(); // clear first; a second Esc reaches the parent overlay
            onChange('');
          }
        }}
        className={cn(fieldBase, fieldBorder(), 'w-full pl-8 pr-8')}
        {...rest}
      />
      {value && (
        <IconButton label="Clear search" icon={X} size="sm" onClick={() => onChange('')} className="absolute right-0" />
      )}
    </div>
  );
});
