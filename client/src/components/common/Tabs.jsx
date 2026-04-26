import React from "react";

const Tabs = ({ tabs, activeTab, setActiveTab }) => {
  return <div className="w-full min-w-0">
    <div className="relative border-b-2 border-slate-100 overflow-x-auto">
      <nav className="flex min-w-max gap-1 sm:gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActiveTab(tab.name)}
            className={`relative flex-none whitespace-nowrap pb-4 px-4 sm:px-6 text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.name
                ? 'text-emerald-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="relative z-10">{tab.label}</span>
            {activeTab === tab.name && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg shadow-emerald-500/25" />
            )}
            {activeTab === tab.name && (
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/50 to-transparent rounded-t-xl -z-10" />
            )}
          </button>
        ))}
      </nav>
    </div>
    <div className="pt-4 pb-0 sm:pt-6">
      {tabs.map((tab) => {
        if (tab.name === activeTab) {
          return (
            <div
              key={tab.name}
              className="animate-in fade-in duration-300"
            >
              {tab.content}
            </div>
          );
        }
        return null;
      })}
    </div>
  </div>
};

export default Tabs;
