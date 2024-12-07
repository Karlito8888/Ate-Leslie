import React, { useEffect, useState } from "react";
import { MutatingDots } from "react-loader-spinner";
import styles from "./LoadingModal.module.scss";

const LoadingModal = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isContentVisible, setIsContentVisible] = useState(true);

  useEffect(() => {
    // Hide modal after 6 seconds
    const timer = setTimeout(() => {
      setIsContentVisible(false);
      setTimeout(() => setIsVisible(false), 500);
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className={`${styles.modalOverlay} ${isContentVisible ? styles.visible : ""}`}
    >
      <div className={styles.modalContent}>
        <div className={styles.loadingContent}>
          <h2 className={styles.title}>
            Welcome<br />to<br />Ate Leslie's Project
          </h2>
          <div className={styles.spinnerContainer}>
            <MutatingDots
              visible={true}
              height="100"
              width="100"
              color="#C6A355"
              secondaryColor="#AD8A3B"
              radius="12.5"
              ariaLabel="mutating-dots-loading"
              wrapperStyle={{}}
              wrapperClass={styles.spinner}
            />
          </div>
          <p className={styles.loadingText}>
            <span>Loading</span>
            <span className={styles.dot}>.</span>
            <span className={styles.dot}>.</span>
            <span className={styles.dot}>.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingModal;
