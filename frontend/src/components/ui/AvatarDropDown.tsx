import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import React from "react";

interface MenuItem {
  label: string;
  onClick: () => void;
}

interface AvatarDropdownProps {
  userName: string;
  items: MenuItem[];
  size?: number;
}

export const AvatarDropdown: React.FC<AvatarDropdownProps> = ({
  userName,
  items,
}) => {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer`}
      >
        {initials}
      </DropdownMenu.Trigger>

      <DropdownMenu.Content className="bg-white border shadow-md rounded-md mt-2 min-w-[150px]">
        {items.map((item, idx) => (
          <DropdownMenu.Item
            key={idx}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
            onSelect={item.onClick}
          >
            {item.label}
          </DropdownMenu.Item>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
