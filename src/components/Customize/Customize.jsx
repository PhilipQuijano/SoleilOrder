import React from 'react';
import './Customize.css';

const Customize = () => {
  // Sample data for charm options
  const charmOptions = [
    {
      id: 1,
      name: 'CHARM 1',
      description: 'Italian Charms',
      price: '$50 and up',
      image: 'placeholder.jpg'
    },
    {
      id: 2,
      name: 'CHARM 2',
      description: 'Three Studded (Your Choice of Stones)',
      price: '$90 and up',
      image: 'placeholder.jpg'
    },
    {
      id: 3,
      name: 'CHARM 3',
      description: 'Beaded Bracelet in Gold/Silver',
      price: '$50 and up',
      image: 'placeholder.jpg'
    }
  ];

  return (
  <section className="customize" id="customize">
    <div className="main-container"> 
        <h2>Customize yours</h2>
        
        <div className="charm-options">
          {charmOptions.map(charm => (
            <div key={charm.id} className="charm-card">
              <div className="charm-image">
                <img src={charm.image} alt={charm.name} />
              </div>
              <div className="charm-info">
                <h3>{charm.name}</h3>
                <p className="description">{charm.description}</p>
                <p className="price">{charm.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Customize;