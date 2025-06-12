import React from 'react';
import { CSSProperties } from 'react';

type OverlayMapComponentProps = {
  overlayData: SVGSVGElement | string;
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
  // If overlayData is an SVGSVGElement, use its outerHTML as a string
  let svgString: string | null = null;
  if (typeof overlayData !== 'string' && overlayData instanceof SVGSVGElement) {
    svgString = overlayData.outerHTML;
  }

  // If it's a string and looks like an SVG, use it as raw SVG markup
  if (
    (typeof overlayData === 'string' && overlayData.trim().startsWith('<svg')) ||
    svgString
  ) {
    return (
      <div
        style={styles.mapContainer}
        // dangerouslySetInnerHTML is required to render inline SVG markup!
        dangerouslySetInnerHTML={{
          __html: svgString || overlayData,
        }}
      />
    );
  }

  // If it's a string but not inline SVG, treat as URL (for remote or data: URLs)
  if (typeof overlayData === 'string') {
    return (
      <div style={styles.mapContainer}>
        <img src={overlayData} alt="Overlay" style={styles.svgOverlay} />
      </div>
    );
  }

  // If nothing matches, show error
  return (
    <div style={styles.mapContainer}>
      <div>Error Rendering Map Overlays</div>
    </div>
  );
};

export default OverlayMapComponent;
