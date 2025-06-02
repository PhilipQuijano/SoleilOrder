import React, { useState } from 'react';
import { motion } from 'framer-motion';
import defaultSilverCharmImage from '../../assets/default-silver-charm.jpg';

const BraceletPreview = ({ charms, selectedCharm, applyCharmToPosition }) => {
  const [previewCharm, setPreviewCharm] = useState(null);
  
  // Calculate the arc radius based on number of charms (adjust as needed)
  const calculateArcLayout = () => {
    const numCharms = charms.length;
    const radius = 180; // radius of the arc in pixels
    const arcAngle = 180; // semi-circle (180 degrees)
    const startAngle = -90; // Start from the top (-90 degrees)
    
    // Calculate positions for each charm
    return charms.map((_, index) => {
      const angle = startAngle + (arcAngle / (numCharms - 1)) * index;
      const angleInRadians = (angle * Math.PI) / 180;
      
      // Calculate x and y coordinates on the arc
      const x = radius * Math.cos(angleInRadians);
      const y = radius * Math.sin(angleInRadians);
      
      // Calculate rotation for each charm to face outward from the circle center
      const rotation = angle + 90; // Add 90 degrees to make charms face outward
      
      return { x, y, rotation };
    });
  };
  
  // Get positions for each charm
  const charmPositions = calculateArcLayout();
  
  // Handle hovering over charms
  const handleCharmHover = (charm) => {
    setPreviewCharm(charm);
  };
  
  // Handle charm click
  const handleCharmClick = (index) => {
    if (selectedCharm) {
      applyCharmToPosition(index);
    }
  };

  return (
    <div className="bracelet-visual-container">
      {/* Curved bracelet chain */}
      <div className="bracelet-chain-curved" />
      
      {/* Charms positioned along the arc */}
      <div className="bracelet-arc">
        {charms.map((charm, index) => {
          const { x, y, rotation } = charmPositions[index];
          
          return (
            <motion.div
              key={index}
              className={`bracelet-charm ${selectedCharm ? 'selectable' : ''}`}
              style={{
                position: 'absolute',
                transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
              onClick={() => handleCharmClick(index)}
              onMouseEnter={() => handleCharmHover(charm)}
              onMouseLeave={() => setPreviewCharm(null)}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
            >
              <img 
                src={charm.image || defaultSilverCharmImage} 
                alt={charm.name}
                className={charm.type === 'default' ? 'default-charm' : 'custom-charm'}
              />
              {charm.type !== 'default' && (
                <motion.div 
                  className="charm-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {charm.name.charAt(0)}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
      
      {/* Charm preview tooltip */}
      <div className={`charm-preview ${previewCharm ? 'active' : ''}`}>
        {previewCharm && (
          <>
            <img src={previewCharm.image || defaultSilverCharmImage} alt={previewCharm.name} />
            <h4>{previewCharm.name}</h4>
          </>
        )}
      </div>
      
      {/* Wrist outline for visual reference */}
      <div className="wrist-outline" />
    </div>
  );
};

export default BraceletPreview;