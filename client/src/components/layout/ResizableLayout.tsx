import type { ReactNode } from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { GripVertical } from 'lucide-react';

interface ResizableLayoutProps {
    leftContent: ReactNode;
    rightContent: ReactNode;
    initialLeftSize?: number; // percentage (0-100)
}

const ResizableLayout = ({ leftContent, rightContent, initialLeftSize = 70 }: ResizableLayoutProps) => {
    return (
        <div className="h-[calc(100vh-64px)] overflow-hidden bg-gray-100 dark:bg-gray-950">
            <Group orientation="horizontal">
                {/* Left Panel */}
                <Panel defaultSize={initialLeftSize} minSize={30} className="flex flex-col">
                    {leftContent}
                </Panel>

                {/* Resize Handle */}
                <Separator className="w-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-blue-400 dark:hover:bg-blue-600 transition-colors flex items-center justify-center cursor-col-resize group z-50">
                    <div className="h-8 w-1 rounded-full bg-gray-300 dark:bg-gray-600 group-hover:bg-white flex items-center justify-center">
                        <GripVertical size={12} className="text-gray-400 dark:text-gray-500 group-hover:text-white" />
                    </div>
                </Separator>

                {/* Right Panel */}
                <Panel defaultSize={100 - initialLeftSize} minSize={20} className="flex flex-col">
                    {rightContent}
                </Panel>
            </Group>
        </div>
    );
};

export default ResizableLayout;
