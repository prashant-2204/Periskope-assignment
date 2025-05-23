import React from 'react';
import Image from 'next/image';
import { FiHelpCircle, FiRefreshCw, FiChevronDown, FiDownload, FiBellOff, FiStar, FiList } from 'react-icons/fi';
// TODO: Import types User if needed
// TODO: Accept props for user, mainLabel, handleRefresh, refreshing, and any other top bar actions
// TODO: Add clear comments for maintainability

interface HeaderProps {
  mainLabel: string;
  sectionIcons: Record<string, React.ComponentType<{ size: number; className?: string }>>;
  handleRefresh: () => void;
  refreshing: boolean;
}

const Header: React.FC<HeaderProps> = ({ mainLabel, sectionIcons, handleRefresh, refreshing }) => (
  <header className="flex items-center justify-between w-full px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 fixed top-0 left-0 right-0 z-50 h-[var(--header-height)]">
    <div className="flex items-center gap-3">
      <Image src="/periskope-icon.webp" alt="Periskope" width={36} height={36} />
      <span className="flex items-center gap-2 text-sm text-gray-500">
        {sectionIcons[mainLabel] ? (
          <span className="text-xl flex items-center">{React.createElement(sectionIcons[mainLabel], { size: 22, className: "mr-1" })}</span>
        ) : null}
        {mainLabel}
      </span>
    </div>
    <div className="flex items-center gap-2">
      <button
        className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 bg-gray-50 text-gray-700 font-semibold text-xs hover:bg-gray-100 disabled:opacity-60"
        onClick={handleRefresh}
        disabled={refreshing}
      >
        {refreshing ? (
          <span className="animate-spin"><FiRefreshCw className="text-base" /></span>
        ) : (
          <FiRefreshCw className="text-base" />
        )}
        Refresh
      </button>
      <button className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 bg-gray-50 text-gray-700 font-semibold text-xs hover:bg-gray-100">
        <FiHelpCircle className="text-base" /> Help
      </button>
      <button className="flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-200 bg-gray-50 text-gray-700 font-semibold text-xs hover:bg-gray-100">
        <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block mr-1"></span>5 / 6 phones <FiChevronDown className="ml-1 text-base" />
      </button>
      <button className="p-2 rounded-md border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100">
        <FiDownload className="text-base" />
      </button>
      <button className="p-2 rounded-md border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100">
        <FiBellOff className="text-base" />
      </button>
      <button className="p-2 rounded-md border border-gray-200 bg-gray-50 text-yellow-500 hover:bg-yellow-100">
        <FiStar className="text-base" />
      </button>
      <button className="p-2 rounded-md border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100">
        <FiList className="text-base" />
      </button>
    </div>
  </header>
);

export default Header; 