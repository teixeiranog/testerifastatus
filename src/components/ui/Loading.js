import React from 'react';

const Loading = ({ text = "Carregando...", size = "default" }) => {
  const sizeClasses = {
    small: "w-4 h-4",
    default: "w-8 h-8",
    large: "w-12 h-12"
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`${sizeClasses[size]} loading-spinner mb-4`}></div>
      <p className="text-gray-600">{text}</p>
    </div>
  );
};

export default Loading;
