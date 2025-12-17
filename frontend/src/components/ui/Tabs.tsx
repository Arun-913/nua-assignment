import { type ReactNode, type FC } from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';

interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  defaultValue: string;
  tabs: TabItem[];
  className?: string;
}

const Tabs: FC<TabsProps> = ({ defaultValue, tabs, className }) => {
  return (
    <RadixTabs.Root defaultValue={defaultValue} className={className}>
      <RadixTabs.List className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm border border-gray-200 mb-6">
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            key={tab.value}
            value={tab.value}
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 rounded-md transition
              data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600
              data-[state=active]:text-white data-[state=active]:shadow-md hover:bg-gray-50 cursor-pointer"
          >
            {tab.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      {tabs.map((tab) => (
        <RadixTabs.Content key={tab.value} value={tab.value} className="focus:outline-none">
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
};

export default Tabs;
