import React from 'react';

const RifaStatusLogo = ({ className = "h-8 w-auto", inverted = false }) => {
  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo real - imagem STATUS */}
      <img 
        src="/logo-status.jpg" 
        alt="STATUS" 
        className={`h-full w-auto ${inverted ? 'filter invert' : ''}`}
        style={inverted ? { filter: 'invert(1)' } : {}}
      />
    </div>
  );
};

export default RifaStatusLogo;
