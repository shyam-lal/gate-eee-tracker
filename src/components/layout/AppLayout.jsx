import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const AppLayout = ({ children, currentView, onViewChange, onSetupTool, topbarProps }) => {
    return (
        <div className="flex min-h-screen bg-transparent">
            <Sidebar 
                currentView={currentView} 
                onViewChange={onViewChange} 
                onSetupTool={onSetupTool} 
            />
            {/* Main Content Wrapper - offset by sidebar width (w-64 = 16rem = 256px) */}
            <div className="flex-1 ml-64 min-h-screen w-[calc(100%-16rem)] flex flex-col relative z-10 transition-all duration-300">
                <Topbar {...topbarProps} />
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AppLayout;
