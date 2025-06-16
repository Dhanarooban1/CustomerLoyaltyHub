import { Gift, BarChart3, BellRing, Users, UserPlus } from "lucide-react";

interface NavigationProps {
  activeTab: "dashboard" | "campaigns" | "submissions" | "customers";
  onTabChange: (tab: "dashboard" | "campaigns" | "submissions" | "customers") => void;
}

export default function Navigation({ activeTab, onTabChange }: NavigationProps) {
  const tabs = [
    { id: "dashboard" as const, label: "Dashboard", icon: BarChart3 },
    { id: "campaigns" as const, label: "Campaigns", icon: BellRing },
    { id: "submissions" as const, label: "Submissions", icon: Users },
    { id: "customers" as const, label: "Customers", icon: UserPlus },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 brand-gradient rounded-lg flex items-center justify-center">
                <Gift className="text-white" size={16} />
              </div>
              <span className="text-xl font-bold text-slate-900">LoyaltyBoost</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-2 font-medium transition-colors ${
                    isActive
                      ? "text-blue-600"
                      : "text-slate-600 hover:text-blue-600"
                  }`}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
            
            <div className="w-8 h-8 bg-slate-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </nav>
  );
}
