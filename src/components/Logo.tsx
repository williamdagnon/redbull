import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-12 h-12 rounded-full" }) => {
  return (
    <div className={`${className} relative`}>
      <img 
        src="https://i.postimg.cc/zXccQYxR/photo-5861601190846598237-y.jpg" 
        alt="RED BULL" 
        className="w-full rounded-full h-full object-contain"
      />
    </div>
  );
};