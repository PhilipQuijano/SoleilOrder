import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { reviewsApi } from '../../../api/getReviews';
import './Contact.css';

const Contact = () => {
  // State management
  const [reviewData, setReviewData] = useState({
    name: '',
    email: '',
    rating: 5,
    comment: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Event handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReviewData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      await reviewsApi.createReview(reviewData);
      setSubmitMessage('Thank you for your review!');
      setReviewData({
        name: '',
        email: '',
        rating: 5,
        comment: ''
      });
    } catch (error) {
      setSubmitMessage('Sorry, there was an error submitting your review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingClick = (rating) => {
    setReviewData(prev => ({ ...prev, rating }));
  };

  const handleStarKeyDown = (e, star) => {
    // Allow arrow keys to adjust rating and Enter/Space to select
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      setReviewData(prev => ({ ...prev, rating: Math.min(5, prev.rating + 1) }));
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      setReviewData(prev => ({ ...prev, rating: Math.max(1, prev.rating - 1) }));
      e.preventDefault();
    } else if (e.key === 'Enter' || e.key === ' ') {
      setReviewData(prev => ({ ...prev, rating: star }));
      e.preventDefault();
    }
  };

  // Animation variants
  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const cardVariants = {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { delay: 0.2, duration: 0.5 }
  };

  const titleVariants = {
    initial: { y: -20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { delay: 0.3, duration: 0.5 }
  };

  const sectionVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { delay: 0.4, duration: 0.5 }
  };

  const contactInfoVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { delay: 0.5, duration: 0.5 }
  };

  const contactItemVariants = (delay) => ({
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { delay, duration: 0.4 }
  });

  const messageVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    transition: { delay: 0.9, duration: 0.5 }
  };

  return (
    <div className="contact-page">
      <motion.div 
        className="contact-container"
        {...containerVariants}
      >
        <motion.div 
          className="contact-card"
          {...cardVariants}
        >

          <motion.div 
            className="review-section feedback-panel"
            {...sectionVariants}
          >
            <div className="review-header">
              <h2 id="feedback-heading" className="review-title font-montserrat-medium">Feedback</h2>
              <p className="review-subtitle font-inter-regular">Have suggestions or experiences to share? Leave a short review or feedback below — we read every message.</p>
            </div>

            <form onSubmit={handleSubmit} className="review-form" aria-labelledby="feedback-heading">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name" className="form-label font-inter-medium">Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={reviewData.name}
                    onChange={handleInputChange}
                    className="form-input form-input-line font-inter-regular"
                    placeholder="Your full name"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email" className="form-label font-inter-medium">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={reviewData.email}
                    onChange={handleInputChange}
                    className="form-input form-input-line font-inter-regular"
                    placeholder="you@example.com"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="rating" className="form-label font-inter-medium">Rating</label>
                <div className="rating-container">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star ${star <= reviewData.rating ? 'active' : ''}`}
                      onClick={() => handleRatingClick(star)}
                      onKeyDown={(e) => handleStarKeyDown(e, star)}
                      aria-pressed={star <= reviewData.rating}
                      aria-label={`Rate ${star} ${star === 1 ? 'star' : 'stars'}`}
                      title={`Rate ${star} ${star === 1 ? 'star' : 'stars'}`}
                      disabled={isSubmitting}
                    >
                      ★
                    </button>
                  ))}
                  <span className="rating-text font-inter-regular">
                    ({reviewData.rating} star{reviewData.rating !== 1 ? 's' : ''})
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="comment" className="form-label font-inter-medium">Comment</label>
                <textarea
                  id="comment"
                  name="comment"
                  value={reviewData.comment}
                  onChange={handleInputChange}
                  className="form-textarea font-inter-regular"
                  rows="4"
                  placeholder="Share your thoughts about Soleil... (what worked, what didn't, suggestions)"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <button 
                type="submit" 
                className="submit-btn font-montserrat-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>

              {submitMessage && (
                <div className={`submit-message font-inter-regular ${submitMessage.includes('error') ? 'error' : 'success'}`}>
                  {submitMessage}
                </div>
              )}
            </form>
          </motion.div>

          <motion.div 
            className="contact-info"
            {...contactInfoVariants}
          >

            <h2 id="contact-heading" className="review-title font-montserrat-medium">Contact</h2>

            <motion.div 
              className="contact-item"
              {...contactItemVariants(0.6)}
            >
              <div className="contact-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="contact-details contact-details-inline">
                <a href="mailto:soleil.phl.2025@gmail.com" className="contact-link-inline contact-link font-inter-regular" aria-label="Email soleil.phl.2025 at gmail dot com">
                  <span className="contact-value">soleil.phl.2025@gmail.com</span>
                </a>
              </div>
            </motion.div>

            <motion.div 
              className="contact-item"
              {...contactItemVariants(0.7)}
            >
              <div className="contact-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V4C20 2.9 19.1 2 18 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 18H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 6H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="contact-details contact-details-inline">
                <a
                  href="https://facebook.com/people/Soleil-phl/61567161596724/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-link-inline contact-link font-inter-regular"
                  aria-label="Visit Soleil on Facebook (opens in new tab)"
                >
                  <span className="contact-label font-inter-medium">Facebook</span>
                </a>
              </div>
            </motion.div>

            <motion.div 
              className="contact-item"
              {...contactItemVariants(0.8)}
            >
              <div className="contact-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" stroke="currentColor" strokeWidth="2"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="contact-details contact-details-inline">
                <a
                  href="https://www.instagram.com/soleilphl/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-link-inline contact-link font-inter-regular"
                  aria-label="Visit @soleilphl on Instagram (opens in new tab)"
                >
                  <span className="contact-label font-inter-medium">Instagram</span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Contact;