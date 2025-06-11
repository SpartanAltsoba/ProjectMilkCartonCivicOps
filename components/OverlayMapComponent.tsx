import React from 'react';
import { CSSProperties } from 'react';

type OverlayMapComponentProps = {
  overlayData: SVGSVGElement | string; // Accepts an SVG element or a string representation of an SVG.
};

const styles: { [key: string]: CSSProperties } = {
  mapContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  svgOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
};

const OverlayMapComponent: React.FC<OverlayMapComponentProps> = ({ overlayData }) => {
  const renderOverlay = () => {
    if (typeof overlayData === 'string') {
      // Assuming overlayData is a URL to an SVG image such or inline SVG string
      try {
        return <img src={overlayData} alt="Overlay" style={styles.svgOverlay} />;
      } catch (error) {
        console.error('Failed to load SVG overlay from string:', error);
        return <div>Error Loading Map Overlays</div>;
      }
    } else {
      try {
        return <div style={styles.svgOverlay}>{overlayData}</div>;
      } catch (error) {
        console.error('Failed to render SVG overlay:', error);
        return <div>Error Rendering Map Overlays</div>;
      }
    }
  };

  return <div style={styles.mapContainer}>{renderOverlay()}</div>;
};

export default OverlayMapComponent;