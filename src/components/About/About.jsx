import React from 'react';
import './About.css';

const About = () => {
  return (
<div className='about' id="about">
  <div className="main-container">
        <div className="about-content">
          <div className="about-text">
            <h2>Bringing <span className="italic">your vision</span> to life</h2>
            <p>
              What's special about your product, service or company? Use the space below to highlight things that set you apart from your competition, whether it's a special feature, a unique philosophy or awards and recognition that you have received. Think of this as your elevator pitch to get the reader's attention.
            </p>
          </div>
          <div className="about-images">
            <div className="charms-grid">
              {/* This would be populated with actual charm images */}
              {[...Array(20)].map((_, i) => (
                <div key={i} className="charm-item"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;