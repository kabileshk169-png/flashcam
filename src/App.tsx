/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { ToastContainer } from './components/common/Toast';
import { AIAgentDrawer } from './components/agent/AIAgentDrawer';
import { VoiceAgentModal } from './components/agent/VoiceAgentModal';
import { NotificationDrawer } from './components/notifications/NotificationDrawer';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { DemoLibraryPage } from './pages/DemoLibraryPage';
import { VideoVerificationPage } from './pages/VideoVerificationPage';
import { LiveVerificationPage } from './pages/LiveVerificationPage';
import { AISearchPage } from './pages/AISearchPage';
import { AIAnalysisPage } from './pages/AIAnalysisPage';
import { InvestigationsPage } from './pages/InvestigationsPage';
import { EventsAlertsPage } from './pages/EventsAlertsPage';
import { CamerasPage } from './pages/CamerasPage';
import { TimelinePage } from './pages/TimelinePage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const { currentRoute } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderActiveRoute = () => {
    switch (currentRoute) {
      case 'overview':
        return <OverviewPage />;
      case 'live':
        return <LiveVerificationPage />;
      case 'ai-search':
        return <AISearchPage />;
      case 'demo-library':
        return <DemoLibraryPage />;
      case 'video-verification':
        return <VideoVerificationPage />;
      case 'ai-analysis':
        return <AIAnalysisPage />;
      case 'investigations':
        return <InvestigationsPage />;
      case 'events':
        return <EventsAlertsPage />;
      case 'cameras':
        return <CamerasPage />;
      case 'timeline':
        return <TimelinePage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8FC] text-[#102A43] flex flex-col font-sans selection:bg-[#2563EB] selection:text-white">
      {/* Deep Navy Left Navigation Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveRoute()}
        </main>
      </div>

      {/* Global Modals & Drawers */}
      <AIAgentDrawer />
      <VoiceAgentModal />
      <NotificationDrawer />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
