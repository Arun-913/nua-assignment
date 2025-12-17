import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption<T = string> {
  label: string;
  value: T;
}

interface MultiSelectProps<T> {
  options: MultiSelectOption<T>[];
  selected: MultiSelectOption<T>[];
  onChange: (selected: MultiSelectOption<T>[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect<T>({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  className,
}: MultiSelectProps<T>) {
  const toggleOption = (option: MultiSelectOption<T>) => {
    const exists = selected.some(o => o.value === option.value);

    if (exists) {
      onChange(selected.filter(o => o.value !== option.value));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={cn(
          "w-full px-4 py-3 border rounded-lg flex justify-between items-center bg-white",
          className
        )}
      >
        <span className="text-sm text-gray-700">
          {selected.length > 0
            ? selected.map(o => o.label).join(", ")
            : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        align="start"
        className="bg-white shadow-lg rounded-lg p-2 min-w-[220px] z-50"
      >
        {options.map(option => (
          <DropdownMenu.CheckboxItem
            key={String(option.value)}
            checked={selected.some(o => o.value === option.value)}
            onCheckedChange={() => toggleOption(option)}
            className="flex justify-between items-center px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 rounded outline-none"
          >
            {option.label}
            <DropdownMenu.ItemIndicator>
              <Check className="w-4 h-4 text-blue-600" />
            </DropdownMenu.ItemIndicator>
          </DropdownMenu.CheckboxItem>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
